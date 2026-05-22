'use server';

import { PrismaClient } from 'database';
import { hashPassword, verifyPassword, createSession, destroySession, getSession } from './lib/auth';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

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

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      passwordHash,
      firstName: firstName.trim(),
      lastName: lastName?.trim() || null,
      role: 'ADMIN', // All users are admins by default for this platform
    },
  });

  // Create session and redirect
  await createSession(user.id);
  redirect('/dashboard');
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
