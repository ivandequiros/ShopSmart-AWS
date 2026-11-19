import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

// Stored format: scrypt$<salt hex>$<hash hex>. Plain-text passwords are never stored.
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt}$${derived.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  const [algorithm, salt, hashHex] = String(stored).split('$');
  if (algorithm !== 'scrypt' || !salt || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const derived = await scrypt(password, salt, expected.length);
  return crypto.timingSafeEqual(derived, expected);
}
