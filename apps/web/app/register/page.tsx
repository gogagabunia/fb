'use client';

import { useState } from 'react';
import Link from 'next/link';
import { registerAction } from '../auth-actions';

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    // Client-side validation
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const result = await registerAction(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
      // If successful, registerAction will redirect — no need to handle here
    } catch (err: any) {
      // redirect() throws a NEXT_REDIRECT error which is expected
      if (err?.digest?.includes('NEXT_REDIRECT')) return;
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 shadow-sm">
        <div className="flex justify-between items-center w-full px-lg py-sm max-w-container-max mx-auto h-20">
          <Link className="text-headline-md font-bold text-primary" href="/">
            GroupMarket
          </Link>
          <Link
            href="/login"
            className="px-lg py-2.5 rounded-lg font-label-md text-primary hover:bg-surface-container-low transition-all"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Registration Form */}
      <main className="flex-1 flex items-center justify-center px-lg py-xxl">
        <div className="w-full max-w-md">
          {/* Branding */}
          <div className="text-center mb-xl">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-lg shadow-lg">
              <span className="material-symbols-outlined text-on-secondary text-[32px]">person_add</span>
            </div>
            <h1 className="text-display-lg font-bold text-primary mb-sm">Create Account</h1>
            <p className="text-body-md text-on-surface-variant">
              Start turning your Facebook groups into premium marketplaces
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-lg p-xl">
            {error && (
              <div className="mb-lg p-md bg-error-container text-on-error-container rounded-lg flex items-center gap-sm text-label-md font-medium animate-bounce">
                <span className="material-symbols-outlined text-[20px]">error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-lg">
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label htmlFor="firstName" className="block text-label-sm font-bold text-on-surface-variant mb-xs">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    autoComplete="given-name"
                    placeholder="John"
                    className="w-full px-md py-md bg-surface-container-low border border-outline-variant rounded-xl text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-label-sm font-bold text-on-surface-variant mb-xs">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Doe"
                    className="w-full px-md py-md bg-surface-container-low border border-outline-variant rounded-xl text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-label-sm font-bold text-on-surface-variant mb-xs">
                  Email Address *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline text-[20px]">
                    mail
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full pl-xl pr-md py-md bg-surface-container-low border border-outline-variant rounded-xl text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-label-sm font-bold text-on-surface-variant mb-xs">
                  Password *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline text-[20px]">
                    lock
                  </span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="Min. 6 characters"
                    className="w-full pl-xl pr-md py-md bg-surface-container-low border border-outline-variant rounded-xl text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-label-sm font-bold text-on-surface-variant mb-xs">
                  Confirm Password *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline text-[20px]">
                    lock
                  </span>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    className="w-full pl-xl pr-md py-md bg-surface-container-low border border-outline-variant rounded-xl text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-md bg-secondary text-on-secondary rounded-xl font-headline-sm shadow-lg hover:shadow-xl hover:scale-[0.99] active:scale-[0.97] transition-all flex items-center justify-center gap-sm ${
                  loading ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-xl pt-lg border-t border-outline-variant/30 text-center">
              <p className="text-body-sm text-on-surface-variant">
                Already have an account?{' '}
                <Link href="/login" className="text-primary font-bold hover:underline transition-all">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
