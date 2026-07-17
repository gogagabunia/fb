import crypto from 'crypto';

// AES-256-GCM encryption for Facebook session cookies at rest.
// A leaked FB cookie exposes the owner's entire account, so these are treated
// like passwords: encrypted in the DB, decrypted only server-side at scrape time.
//
// ENCRYPTION_KEY should be a long random string set in the environment. In dev
// it falls back to an insecure constant so the app still runs locally.
const KEY = crypto
  .createHash('sha256')
  .update(process.env.ENCRYPTION_KEY || 'dev-insecure-encryption-key-change-me')
  .digest(); // 32 bytes

const IV_LEN = 12;
const TAG_LEN = 16;

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
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
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}
