import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { config, ServiceConfig } from '../../config/gateway.config';
import { NotFoundException } from '../../utils/appError';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import crypto from 'crypto';
import { Env } from '../../config/env.config';
import { Request } from 'express';
import { NatsService } from '../../common/services/nats.service';

interface FileData {
  file: boolean;
  path: string;
  name: string;
  type: string;
}

const services: Record<string, ServiceConfig> = {};
Object.values(config.services).forEach((service) => {
  services[service.name] = service;
});

@Injectable()
export class GatewayService {
  constructor(private readonly natsService: NatsService) {}
  async forwardRequest(
    serviceName: string,
    targetPath: string,
    req: Request,
  ): Promise<AxiosResponse> {
    const service = services[serviceName];
    if (!service) {
      throw new NotFoundException(`Service '${serviceName}' is not registered`);
    }

    const targetUrl = this.buildTargetUrl(service.url, targetPath);
    console.log(`Forwarding ${req.method} ${req.path} -> ${targetUrl}`);

    const downstreamHeaders = this.attachSignedAuthHeaders(req.headers, req);

    const response = await this.makeRequest(
      targetUrl,
      req.method as any,
      req.body,
      downstreamHeaders,
      service.timeout,
    );

    return response;
  }

  /**
   * Forward an action over NATS (request/response style).
   * This is useful when you want the gateway to call a backend action
   * via messaging instead of HTTP.
   */
  async forwardActionViaNats<TResponse = unknown>(
    subject: string,
    payload: unknown,
    timeoutMs = 5000,
  ): Promise<TResponse> {
    return this.natsService.request<TResponse>(subject, payload, timeoutMs);
  }

  private buildTargetUrl(baseUrl: string, path: string): string {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBaseUrl}/${cleanPath}`;
  }

  private async makeRequest(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    data: any,
    headers: any,
    timeout: number,
  ): Promise<AxiosResponse> {
    const filteredHeaders = { ...headers };
    delete filteredHeaders.host;
    delete filteredHeaders.connection;
    delete filteredHeaders['content-length'];

    if (headers.cookie) {
      filteredHeaders.cookie = headers.cookie;
    }

    const requestConfig: any = {
      method,
      url,
      timeout,
      headers: filteredHeaders,
      validateStatus: () => true,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      if (headers['content-type']?.includes('multipart/form-data')) {
        const formData = new FormData();

        for (const key in data) {
          if (data[key] !== undefined && data[key] !== null) {
            const value = data[key];
            if (typeof value === 'object' && value !== null && 'file' in value) {
              const file = value as FileData;
              formData.append(key, createReadStream(file.path), {
                filename: file.name,
                contentType: file.type,
              });
            } else if (Array.isArray(value)) {
              value.forEach((item: unknown) => {
                if (item !== undefined && item !== null) {
                  formData.append(key, String(item));
                }
              });
            } else {
              formData.append(key, String(value));
            }
          }
        }

        requestConfig.data = formData;
        const formHeaders = formData.getHeaders();
        requestConfig.headers = {
          ...filteredHeaders,
          ...formHeaders,
          'Content-Length': await new Promise<number>((resolve, reject) => {
            formData.getLength((err: Error | null, length: number) => {
              if (err) reject(err);
              else resolve(length);
            });
          }).then((len) => len.toString()),
        };
      } else if (headers['content-type']?.includes('application/x-www-form-urlencoded')) {
        const formData = new URLSearchParams();
        for (const key in data) {
          if (Array.isArray(data[key])) {
            data[key].forEach((item: any) => {
              formData.append(key, item);
            });
          } else if (data[key] !== undefined && data[key] !== null) {
            formData.append(key, data[key]);
          }
        }
        requestConfig.data = formData.toString();
        requestConfig.headers = {
          ...filteredHeaders,
          'Content-Type': 'application/x-www-form-urlencoded',
        };
      } else {
        requestConfig.data = data;
        if (!headers['content-type']) {
          requestConfig.headers = {
            ...filteredHeaders,
            'Content-Type': 'application/json',
          };
        }
      }
    }

    return await axios(requestConfig);
  }

  private attachSignedAuthHeaders(originalHeaders: any, req: Request) {
    const headers = { ...originalHeaders };

    const user = (req as any).user as
      | undefined
      | {
          id: string;
          name?: string;
          email?: string;
          role: string;
          permissions: string[];
        };

    if (user && Env.GATEWAY_SIGNING_SECRET) {
      const ts = Math.floor(Date.now() / 1000);
      const perms = Array.isArray(user.permissions) ? user.permissions.join(',') : '';
      const payload = `${user.id}|${user.role}|${perms}|${ts}`;
      const sig = crypto
        .createHmac('sha256', Env.GATEWAY_SIGNING_SECRET)
        .update(payload)
        .digest('hex');

      headers['x-user-id'] = user.id;
      headers['x-user-role'] = user.role;
      headers['x-user-permissions'] = perms;
      headers['x-ctx-ts'] = String(ts);
      headers['x-ctx-sig'] = sig;
      if (user.name) headers['x-user-name'] = user.name;
      if (user.email) headers['x-user-email'] = user.email;
    }

    return headers;
  }

  async checkServiceHealth(serviceName: string): Promise<boolean> {
    try {
      const service = services[serviceName];
      if (!service) return false;
      const response = await axios.get(`${service.url}${service.healthCheck}`, {
        timeout: 3000,
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async getServiceStatus(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {};
    const promises: Promise<[string, boolean]>[] = [];
    Object.entries(services).forEach(([name, service]) => {
      promises.push(this.checkServiceHealth(name).then((health) => [name, health]));
    });
    const results = await Promise.all(promises);
    results.forEach(([name, health]) => {
      status[name] = health;
    });
    return status;
  }
}

