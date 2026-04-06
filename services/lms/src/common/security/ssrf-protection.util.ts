import { BadRequestException } from '@nestjs/common';
import { isIP } from 'net';

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split('.').map((n) => Number(n));
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function assertHostSafety(hostname: string) {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host === '::1') {
    throw new BadRequestException('Unsafe host is blocked');
  }
  const ipVersion = isIP(host);
  if (ipVersion === 4 && isPrivateIPv4(host)) {
    throw new BadRequestException('Private IP targets are blocked');
  }
  if (host === '169.254.169.254') {
    throw new BadRequestException('Metadata IP is blocked');
  }
}

export function buildSafeExternalUrl(
  baseUrl: string,
  endpoint: string,
  allowedHosts: string[],
): string {
  const parsed = new URL(baseUrl);
  assertHostSafety(parsed.hostname);
  if (allowedHosts.length && !allowedHosts.includes(parsed.hostname)) {
    throw new BadRequestException('Host is not in outbound allowlist');
  }
  const url = new URL(endpoint, `${parsed.origin}/`);
  return url.toString();
}

export function assertSafeExternalUrl(url: string, allowedHosts: string[]) {
  const parsed = new URL(url);
  assertHostSafety(parsed.hostname);
  if (allowedHosts.length && !allowedHosts.includes(parsed.hostname)) {
    throw new BadRequestException('Host is not in outbound allowlist');
  }
}
