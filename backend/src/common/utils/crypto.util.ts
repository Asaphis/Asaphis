import { createHash, randomInt } from 'crypto';
import * as bcrypt from 'bcryptjs';

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function generateOtp(length = 6): string {
  let out = '';
  for (let i = 0; i < length; i++) out += String(randomInt(0, 10));
  return out;
}

export async function hashPassword(plain: string, rounds = 12): Promise<string> {
  return bcrypt.hash(plain, rounds);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function memberCodeFor(countryCode: string): string {
  const rand = randomInt(100000, 999999).toString().slice(2);
  const yy = new Date().getFullYear().toString().slice(2);
  return `MEM-${countryCode.toUpperCase()}-${yy}${rand}`;
}
