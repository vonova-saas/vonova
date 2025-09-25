import { Request, Response, NextFunction } from 'express';
import axios, { AxiosResponse } from 'axios';
import { config, ServiceConfig } from '../config/gateway.config';
import { NotFoundException } from '../utils/appError';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import crypto from 'crypto';
import { Env } from '../config/env.config';

declare module 'form-data' {
  interface FormData {
    getHeaders(): Record<string, string>;
    getLength(callback: (err: Error | null, length: number) => void): void;
  }
}

interface FileData {
  file: boolean;
  path: string;
  name: string;
  type: string;
}

const services: Record<string, ServiceConfig> = {};
Object.values(config.services).forEach(service => {
  services[service.name] = service;
});

export async function forwardRequest(
  serviceName: string,
  targetPath: string,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const service = services[serviceName];
    if (!service) {
      throw new NotFoundException(`Service '${serviceName}' is not registered`);
    }

    const targetUrl = buildTargetUrl(service.url, targetPath);
    console.log(`Forwarding ${req.method} ${req.path} -> ${targetUrl}`);

    // Merge original headers with Gateway-signed auth context (if available)
    const downstreamHeaders = attachSignedAuthHeaders(req.headers, req);

    const response = await makeRequest(
      targetUrl,
      req.method as any,
      req.body,
      downstreamHeaders,
      service.timeout
    );

    // Forward response headers
    Object.keys(response.headers).forEach(key => {
      if (key.toLowerCase() !== 'content-encoding' &&
        key.toLowerCase() !== 'content-length') {
        res.setHeader(key, response.headers[key]);
      }
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    next(error);
  }
}

function buildTargetUrl(baseUrl: string, path: string): string {
  // Remove leading slash from path if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // Remove trailing slash from baseUrl if present
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBaseUrl}/${cleanPath}`;
}

async function makeRequest(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  data: any,
  headers: any,
  timeout: number
): Promise<AxiosResponse> {
  // Filter out headers that shouldn't be forwarded
  const filteredHeaders = { ...headers };
  delete filteredHeaders.host;
  delete filteredHeaders.connection;
  delete filteredHeaders['content-length'];

  // Forward cookies if present
  if (headers.cookie) {
    filteredHeaders.cookie = headers.cookie;
  }

  const config: any = {
    method,
    url,
    timeout,
    headers: filteredHeaders,
    validateStatus: () => true // Don't throw on HTTP error status
  };

  // Handle request data
  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    // Handle multipart/form-data
    if (headers['content-type']?.includes('multipart/form-data')) {
      const formData = new FormData();

      // Process each field in the request body
      for (const key in data) {
        if (data[key] !== undefined && data[key] !== null) {
          const value = data[key];
          // Handle file uploads
          if (typeof value === 'object' && value !== null && 'file' in value) {
            const file = value as FileData;
            formData.append(key, createReadStream(file.path), {
              filename: file.name,
              contentType: file.type
            });
          }
          // Handle array fields
          else if (Array.isArray(value)) {
            value.forEach((item: unknown) => {
              if (item !== undefined && item !== null) {
                formData.append(key, String(item));
              }
            });
          }
          // Handle regular fields
          else {
            formData.append(key, String(value));
          }
        }
      }

      // Use form-data with proper headers
      config.data = formData;
      const headers = formData.getHeaders();
      config.headers = {
        ...filteredHeaders,
        ...headers,
        'Content-Length': await new Promise<number>((resolve, reject) => {
          formData.getLength((err: Error | null, length: number) => {
            if (err) reject(err);
            else resolve(length);
          });
        }).then(len => len.toString())
      };
    }
    // Handle URL-encoded form data
    else if (headers['content-type']?.includes('application/x-www-form-urlencoded')) {
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
      config.data = formData.toString();
      config.headers = {
        ...filteredHeaders,
        'Content-Type': 'application/x-www-form-urlencoded'
      };
    }
    // Handle JSON data
    else {
      config.data = data;
      if (!headers['content-type']) {
        config.headers = {
          ...filteredHeaders,
          'Content-Type': 'application/json'
        };
      }
    }
  }

  return await axios(config);
}

  function attachSignedAuthHeaders(originalHeaders: any, req: Request) {
    const headers = { ...originalHeaders };

    // If user context is present (set by tokenVerification.middleware), sign and attach
    const user = (req as any).user as undefined | {
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
      const sig = crypto.createHmac('sha256', Env.GATEWAY_SIGNING_SECRET).update(payload).digest('hex');

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

  export async function checkServiceHealth(serviceName: string): Promise<boolean> {
    try {
      const service = services[serviceName];
      if (!service) return false;
      const response = await axios.get(`${service.url}${service.healthCheck}`, { timeout: 3000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  export async function getServiceStatus(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {};
    const promises: Promise<[string, boolean]>[] = [];
    Object.entries(services).forEach(([name, service]) => {
      promises.push(
        checkServiceHealth(name).then(health => [name, health])
      );
    });
    const results = await Promise.all(promises);
    results.forEach(([name, health]) => {
      status[name] = health;
    });
    return status;
}