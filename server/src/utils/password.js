import { scrypt, randomBytes, timingSafeEqual, createHash } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export async function hashPassword(plain) {
  const salt = randomBytes(16).toString('hex');
  const key = await scryptAsync(plain, salt, 64);
  return `${salt}:${key.toString('hex')}`;
}

export async function verifyPassword(plain, stored) {
  const [salt, hash] = (stored ?? '').split(':');
  if (!salt || !hash) return false;
  const key = await scryptAsync(plain, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return key.length === expected.length && timingSafeEqual(key, expected);
}

export const sha256 = (s) => createHash('sha256').update(s).digest('hex');
export const randomToken = () => randomBytes(32).toString('hex');
