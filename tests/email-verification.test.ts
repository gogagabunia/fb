import { describe, it, expect } from 'vitest';
import {
  generateVerificationCode,
  verificationExpiry,
  isVerificationExpired,
  hashVerificationCode,
  verifyVerificationCode,
  VERIFICATION_CODE_LENGTH,
  VERIFICATION_CODE_TTL_MS,
} from '../apps/web/app/lib/email-verification';

describe('generateVerificationCode', () => {
  it('returns a 6-digit numeric string by default', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateVerificationCode();
      expect(code).toHaveLength(VERIFICATION_CODE_LENGTH);
      expect(code).toMatch(/^[0-9]{6}$/);
    }
  });

  it('honors a custom length', () => {
    expect(generateVerificationCode(4)).toMatch(/^[0-9]{4}$/);
  });
});

describe('verificationExpiry', () => {
  it('is the given moment plus the TTL', () => {
    const now = 1_000_000;
    expect(verificationExpiry(now).getTime()).toBe(now + VERIFICATION_CODE_TTL_MS);
  });
});

describe('isVerificationExpired', () => {
  const now = 2_000_000;

  it('treats a missing expiry as expired', () => {
    expect(isVerificationExpired(null, now)).toBe(true);
    expect(isVerificationExpired(undefined, now)).toBe(true);
  });

  it('is false before the deadline and true at/after it', () => {
    expect(isVerificationExpired(new Date(now + 1000), now)).toBe(false);
    expect(isVerificationExpired(new Date(now), now)).toBe(true);
    expect(isVerificationExpired(new Date(now - 1), now)).toBe(true);
  });

  it('accepts an ISO string expiry', () => {
    expect(isVerificationExpired(new Date(now + 1000).toISOString(), now)).toBe(false);
  });
});

describe('hash/verify round-trip', () => {
  it('accepts the right code and rejects the wrong one', async () => {
    const hash = await hashVerificationCode('123456');
    expect(await verifyVerificationCode('123456', hash)).toBe(true);
    expect(await verifyVerificationCode('654321', hash)).toBe(false);
  });
});
