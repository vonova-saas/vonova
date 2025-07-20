import { Request, Response, NextFunction } from 'express';
import axios, { AxiosResponse } from 'axios';
import { config, ServiceConfig } from '../config/gateway.config';
import { NotFoundException } from '../utils/appError';

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

    const response = await makeRequest(
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