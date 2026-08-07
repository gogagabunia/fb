import crypto from 'crypto';
import { lazySecret } from './secrets';

// AES-256-GCM encryption for Facebook session cookies at rest.
// A leaked FB cookie exposes the owner's entire account, so these are treated
// like passwords: encrypted in the DB, decrypted only server-side at scrape time.
//
// ENCRYPTION_KEY must be a long random string set in the environment. In dev it
// falls back to an insecure constant; in production a missing key throws rather
// than silently encrypting everything under a publicly-known key.
const resolveEncryptionKey = lazySecret('ENCRYPTION_KEY', 'dev-insecure-encryption-key-change-me');

/** 32-byte AES key, derived on first use rather than at module load. */
function key(): Buffer {
  return crypto.createHash('sha256').update(resolveEncryptionKey()).digest();
}

const IV_LEN = 12;
const TAG_LEN = 16;

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Layout: [iv | tag | ciphertext], base64-encoded.
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decrypt(payload: string): string {
  const buf = Buffer.from(payload, 'base64');
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const enc = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}
