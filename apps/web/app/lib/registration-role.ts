import type { AppRole } from './authz';

/**
 * Which role a new registration gets.
 *
 * The register form offers Buyer and Seller; anything else arriving in the
 * request (a tampered form can send any string) degrades to BUYER — never
 * upward. The configured admin email wins over the form choice, which is how
 * the site operator's account becomes ADMIN on first registration instead of
 * needing a database edit.
 *
 * Pure so it can be tested without the action's rate limiter and database.
 */
export function resolveRegistrationRole(
  requested: string | null | undefined,
  email: string,
  adminEmail: string | undefined = process.env.ADMIN_EMAIL
): AppRole {
  if (adminEmail && email.trim().toLowerCase() === adminEmail.trim().toLowerCase()) {
    return 'ADMIN';
  }
  return requested === 'SELLER' ? 'SELLER' : 'BUYER';
}
