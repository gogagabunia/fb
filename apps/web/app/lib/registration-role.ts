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

/**
 * Whether an already-existing account should be promoted to ADMIN on login.
 *
 * `resolveRegistrationRole` only runs once, at registration. An operator who
 * sets `ADMIN_EMAIL` *after* their account already exists would otherwise stay
 * a BUYER/SELLER forever — this lets the next successful login reconcile the
 * role without a manual database edit or re-registration.
 *
 * Only ever asks for a promotion: it returns false for an account that is
 * already ADMIN and never requests a demotion, so clearing or changing
 * `ADMIN_EMAIL` cannot strip an existing admin. Pure, for the same reason as
 * the function above.
 */
export function shouldPromoteToAdmin(
  email: string,
  currentRole: string | null | undefined,
  adminEmail: string | undefined = process.env.ADMIN_EMAIL
): boolean {
  if (!adminEmail) return false;
  if (currentRole === 'ADMIN') return false;
  return email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
}
