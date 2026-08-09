import { describe, it, expect } from 'vitest';
import { resolveRegistrationRole, shouldPromoteToAdmin } from '../apps/web/app/lib/registration-role';

const ADMIN = 'gabuniagoga19@gmail.com';

describe('resolveRegistrationRole', () => {
  it('defaults to BUYER', () => {
    expect(resolveRegistrationRole(null, 'someone@example.com', ADMIN)).toBe('BUYER');
    expect(resolveRegistrationRole('BUYER', 'someone@example.com', ADMIN)).toBe('BUYER');
  });

  it('grants SELLER when asked', () => {
    expect(resolveRegistrationRole('SELLER', 'someone@example.com', ADMIN)).toBe('SELLER');
  });

  it('never grants ADMIN from the form', () => {
    // The form is client-controlled — a tampered request can send any string.
    for (const requested of ['ADMIN', 'admin', 'root', 'seller', '', 'MODERATOR']) {
      expect(resolveRegistrationRole(requested, 'someone@example.com', ADMIN), requested).toBe('BUYER');
    }
  });

  it('promotes the configured admin email, whatever the form said', () => {
    expect(resolveRegistrationRole('BUYER', ADMIN, ADMIN)).toBe('ADMIN');
    expect(resolveRegistrationRole('SELLER', ADMIN, ADMIN)).toBe('ADMIN');
  });

  it('matches the admin email case-insensitively with stray spaces', () => {
    expect(resolveRegistrationRole(null, '  GabuniaGoga19@Gmail.com ', ADMIN)).toBe('ADMIN');
  });

  it('promotes nobody when ADMIN_EMAIL is unset', () => {
    // An unset variable must not make some accidental value match.
    expect(resolveRegistrationRole('SELLER', ADMIN, undefined)).toBe('SELLER');
    expect(resolveRegistrationRole(null, '', undefined)).toBe('BUYER');
  });
});

describe('shouldPromoteToAdmin', () => {
  it('promotes the configured admin email when not already ADMIN', () => {
    expect(shouldPromoteToAdmin(ADMIN, 'BUYER', ADMIN)).toBe(true);
    expect(shouldPromoteToAdmin(ADMIN, 'SELLER', ADMIN)).toBe(true);
    expect(shouldPromoteToAdmin(ADMIN, null, ADMIN)).toBe(true);
  });

  it('matches case-insensitively with stray spaces', () => {
    expect(shouldPromoteToAdmin('  GabuniaGoga19@Gmail.com ', 'BUYER', ADMIN)).toBe(true);
  });

  it('is a no-op for an account that is already ADMIN', () => {
    expect(shouldPromoteToAdmin(ADMIN, 'ADMIN', ADMIN)).toBe(false);
  });

  it('never promotes a non-matching email', () => {
    expect(shouldPromoteToAdmin('someone@example.com', 'BUYER', ADMIN)).toBe(false);
  });

  it('never promotes anyone when ADMIN_EMAIL is unset', () => {
    expect(shouldPromoteToAdmin(ADMIN, 'BUYER', undefined)).toBe(false);
    expect(shouldPromoteToAdmin('', 'BUYER', undefined)).toBe(false);
  });
});
