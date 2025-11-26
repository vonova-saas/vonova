// import * as bcrypt from 'bcrypt';

export async function generateDeviceHash(deviceInfo: string): Promise<string> {
  // const saltRounds = 10;
  // return await bcrypt.hash(deviceInfo, saltRounds);
  return Buffer.from(deviceInfo).toString('base64'); // Simple fallback
}

export async function compareDeviceHash(deviceInfo: string, hash: string): Promise<boolean> {
  // return await bcrypt.compare(deviceInfo, hash);
  return Buffer.from(deviceInfo).toString('base64') === hash; // Simple fallback
}
