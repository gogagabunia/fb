'use server';

import { hashPassword, verifyPassword, createSession, destroySession, getSession } from './lib/auth';
import { redirect } from 'next/navigation';
import { authRateLimiter } from './lib/rate-limiter';
import { prisma } from './lib/prisma';
import { resolveRegistrationRole, shouldPromoteToAdmin } from './lib/registration-role';
import { sendVerificationEmail } from './lib/email';
import {
  generateVerificationCode,
  hashVerificationCode,
  verifyVerificationCode,
  verificationExpiry,
  isVerificationExpired,
  MAX_VERIFICATION_ATTEMPTS,
} from './lib/email-verification';

/**
 * Issue a fresh verification code for a user, persist its hash + expiry, reset
 * the attempts counter, and email it. Shared by registration, resend, and the
 * "you must verify first" branch of login so all three send an identical,
 * always-current code.
 */
async function issueVerificationCode(userId: string, email: string): Promise<void> {
  const code = generateVerificationCode();
  const verificationCodeHash = await hashVerificationCode(code);

  await prisma.user.update({
    where: { id: userId },
    data: {
      verificationCodeHash,
      verificationCodeExpiresAt: verificationExpiry(),
      verificationAttempts: 0,
    },
  });

  await sendVerificationEmail(email, code);
}

/**
 * Register a new user with email and password
 */
export async function registerAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;

  // Validation
  if (!email || !password || !firstName) {
    return { error: 'Please fill in all required fields.' };
  }

  // Rate Limiting Check
  const limitKey = `register:${email.toLowerCase().trim()}`;
  const rateLimit = authRateLimiter.limit(limitKey);
  if (!rateLimit.success) {
    return { error: `Too many registration attempts. Please try again in ${Math.ceil(rateLimit.resetMs / 1000)} seconds.` };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (existingUser) {
    return { error: 'An account with this email already exists. Please log in.' };
  }

  // Hash password and create user
  const passwordHash = await hashPassword(password);

  // The form's choice, degraded to BUYER for anything unexpected; ADMIN_EMAIL
  // overrides both. This line used to read `role: 'ADMIN'` with the comment
  // "All users are admins by default for this platform" — every registration
  // was an admin.
  const role = resolveRegistrationRole(formData.get('role') as string | null, email);

  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      firstName: firstName.trim(),
      lastName: lastName?.trim() || null,
      role,
      // New accounts start unverified and get no session until they confirm the
      // emailed code. Existing rows keep the schema default (true).
      emailVerified: false,
    },
  });

  await issueVerificationCode(user.id, normalizedEmail);

  // No session yet — the client sends the user to /verify-email with this
  // address to enter the code.
  return { success: true, email: normalizedEmail };
}

/**
 * Confirm a registration code and, on success, start the user's first session.
 */
export async function verifyEmailAction(formData: FormData) {
  const email = ((formData.get('email') as string) || '').toLowerCase().trim();
  const code = ((formData.get('code') as string) || '').trim();

  if (!email || !code) {
    return { error: 'Please enter the verification code.' };
  }

  // Rate-limit by email so a burned code can't be brute-forced across many
  // requests even if the per-code attempts counter is somehow bypassed.
  const rateLimit = authRateLimiter.limit(`verify:${email}`);
  if (!rateLimit.success) {
    return { error: `Too many attempts. Please try again in ${Math.ceil(rateLimit.resetMs / 1000)} seconds.` };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: 'Invalid or expired code.' };
  }

  if (user.emailVerified) {
    // Already done — nothing to verify, just point them at login.
    return { error: 'This account is already verified. Please log in.' };
  }

  if (
    !user.verificationCodeHash ||
    isVerificationExpired(user.verificationCodeExpiresAt) ||
    user.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS
  ) {
    return { error: 'This code has expired. Please request a new one.', expired: true };
  }

  const codeMatches = await verifyVerificationCode(code, user.verificationCodeHash);
  if (!codeMatches) {
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationAttempts: { increment: 1 } },
    });
    return { error: 'Invalid or expired code.' };
  }

  // Success: mark verified, clear the one-time code, and start the session.
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationCodeHash: null,
      verificationCodeExpiresAt: null,
      verificationAttempts: 0,
    },
  });

  await createSession(user.id);
  redirect('/dashboard');
}

/**
 * Re-send a verification code to an unverified account. Always reports success
 * to the client (even for an unknown or already-verified email) so it cannot be
 * used to probe which addresses have accounts.
 */
export async function resendVerificationAction(rawEmail: string) {
  const email = (rawEmail || '').toLowerCase().trim();
  if (!email) {
    return { error: 'Please enter your email address.' };
  }

  const rateLimit = authRateLimiter.limit(`resend:${email}`);
  if (!rateLimit.success) {
    return { error: `Too many requests. Please try again in ${Math.ceil(rateLimit.resetMs / 1000)} seconds.` };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.emailVerified) {
    await issueVerificationCode(user.id, email);
  }

  return { success: true };
}

/**
 * Log in an existing user with email and password
 */
export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please enter your email and password.' };
  }

  // Rate Limiting Check
  const limitKey = `login:${email.toLowerCase().trim()}`;
  const rateLimit = authRateLimiter.limit(limitKey);
  if (!rateLimit.success) {
    return { error: `Too many login attempts. Please try again in ${Math.ceil(rateLimit.resetMs / 1000)} seconds.` };
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user || !user.passwordHash) {
    return { error: 'Invalid email or password.' };
  }

  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    return { error: 'Invalid email or password.' };
  }

  // Block sign-in until the emailed code is confirmed. Send a fresh code so the
  // user can finish verifying straight from the login attempt, then have the
  // client route them to the verification screen.
  if (!user.emailVerified) {
    await issueVerificationCode(user.id, user.email);
    return { needsVerification: true, email: user.email };
  }

  // Reconcile against ADMIN_EMAIL: if the operator set it after this account
  // already existed, the matching user is promoted to ADMIN here instead of
  // needing a database edit or a fresh registration. Only ever promotes.
  if (shouldPromoteToAdmin(user.email, user.role)) {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
    });
  }

  // Create session and redirect
  await createSession(user.id);
  redirect('/dashboard');
}

/**
 * Log out the current user
 */
export async function logoutAction() {
  await destroySession();
  redirect('/');
}

/**
 * Get the currently authenticated user, or null if not logged in
 */
export async function getCurrentUser() {
  const userId = await getSession();
  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        imageUrl: true,
      },
    });
    return user;
  } catch {
    return null;
  }
}

/**
 * Update current user's password
 */
export async function updatePasswordAction(formData: FormData) {
  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'All fields are required.' };
  }

  if (newPassword.length < 6) {
    return { error: 'New password must be at least 6 characters.' };
  }

  if (newPassword !== confirmPassword) {
    return { error: 'New passwords do not match.' };
  }

  const userId = await getSession();
  if (!userId) {
    return { error: 'You must be logged in to update your password.' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      return { error: 'User not found.' };
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return { error: 'Incorrect current password.' };
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Failed to update password:', error);
    return { error: error.message || 'Failed to update password.' };
  }
}
