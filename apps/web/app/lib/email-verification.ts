import { randomInt } from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Email-verification primitives, kept in one place so the server action reads
 * as a flow and the fiddly bits (code shape, expiry maths, hashing) are unit
 * tested in isolation — the same split as registration-role.ts.
 */

export const VERIFICATION_CODE_LENGTH = 6;
/** A code is good for 15 minutes; after that a resend is required. */
export const VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000;
/** How many wrong guesses a single code tolerates before it is burned. */
export const MAX_VERIFICATION_ATTEMPTS = 5;

/**
 * A zero-padded numeric code, e.g. "042913". Uses crypto.randomInt so the
 * digits are uniform and unpredictable — Math.random would be neither.
 */
export function generateVerificationCode(length: number = VERIFICATION_CODE_LENGTH): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += randomInt(0, 10).toString();
  }
  return code;
}

/** When a code generated `now` should stop being accepted. */
export function verificationExpiry(now: number = Date.now()): Date {
  return new Date(now + VERIFICATION_CODE_TTL_MS);
}

/**
 * True when there is no live code to check against — either none was ever
 * issued (null) or the deadline has passed. A missing expiry reads as expired,
 * never as "valid forever".
 */
export function isVerificationExpired(
  expiresAt: Date | string | null | undefined,
  now: number = Date.now()
): boolean {
  if (!expiresAt) return true;
  return now >= new Date(expiresAt).getTime();
}

export async function hashVerificationCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function verifyVerificationCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}
