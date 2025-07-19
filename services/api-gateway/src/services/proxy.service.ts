import { Request, Response, NextFunction } from 'express';
import axios, { AxiosResponse } from 'axios';
import { config, ServiceConfig } from '../config/gateway.config';

export class ProxyService {
  private services: Map<string, ServiceConfig>;

  constructor() {
    this.services = new Map();
    Object.values(config.services).forEach(service => {
      this.services.set(service.name, service);
    });
  }

  async forwardRequest(
    serviceName: string,
    targetPath: string,
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const service = this.services.get(serviceName);
      if (!service) {
        res.status(404).json({
          error: 'Service Not Found',
          message: `Service '${serviceName}' is not registered`
        });
        return;
      }

      const targetUrl = this.buildTargetUrl(service.url, targetPath);

      console.log(`Forwarding ${req.method} ${req.path} -> ${targetUrl}`);

      const response = await this.makeRequest(
        targetUrl,
        req.method as any,
        req.body,
        req.headers,
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

  private buildTargetUrl(baseUrl: string, path: string): string {
    // Remove leading slash from path if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    // Remove trailing slash from baseUrl if present
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    return `${cleanBaseUrl}/${cleanPath}`;
  }

  private async makeRequest(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    data: any,
    headers: any,
    timeout: number
  ): Promise<AxiosResponse> {

    // Filter out hop-by-hop headers
    const filteredHeaders = { ...headers };
    delete filteredHeaders.host;
    delete filteredHeaders.connection;
    delete filteredHeaders['content-length'];

    const config: any = {
      method,
      url,
      timeout,
      headers: filteredHeaders,
      validateStatus: () => true // Don't throw on HTTP error status
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }

    return await axios(config);
  }

  async checkServiceHealth(serviceName: string): Promise<boolean> {
    try {
      const service = this.services.get(serviceName);
      if (!service) return false;

      const response = await axios.get(`${service.url}${service.healthCheck}`, {
        timeout: 3000
      });

      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async getServiceStatus(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {};
    const promises: Promise<[string, boolean]>[] = [];

    this.services.forEach((service, name) => {
      promises.push(
        this.checkServiceHealth(name).then(health => [name, health])
      );
    });

    const results = await Promise.all(promises);
    results.forEach(([name, health]) => {
      status[name] = health;
    });

    return status;
  }
}