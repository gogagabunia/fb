'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerAction } from '../auth-actions';
import { makeT } from '../lib/i18n';
import { authStrings } from '../lib/i18n/auth';
import { useLang } from '../components/lang-provider';
import { LangSwitcher } from '../components/lang-switcher';

export default function RegisterPage() {
  const lang = useLang();
  const tr = makeT(authStrings, lang);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'BUYER' | 'SELLER'>('BUYER');

  // The homepage's "+ Sell" CTA links here with ?role=seller. Read it after
  // mount (not useSearchParams) so the page needs no Suspense boundary.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('role') === 'seller') {
      setRole('SELLER');
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    // Client-side validation
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password.length < 6) {
      setError(tr('passwordTooShort'));
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(tr('passwordsDoNotMatch'));
      setLoading(false);
      return;
    }

    try {
      const result = await registerAction(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      if (result?.success) {
        // Account created but unverified — go enter the emailed code.
        router.push(`/verify-email?email=${encodeURIComponent(result.email)}`);
        return;
      }
      setLoading(false);
    } catch (err: any) {
      // redirect() throws a NEXT_REDIRECT error which is expected
      if (err?.digest?.includes('NEXT_REDIRECT')) return;
      setError(tr('genericError'));
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
          <div className="flex items-center gap-md">
            <LangSwitcher current={lang} />
            <Link
              href="/login"
              className="px-lg py-2.5 rounded-lg font-label-md text-primary hover:bg-surface-container-low transition-all"
            >
              {tr('headerSignIn')}
            </Link>
          </div>
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
            <h1 className="text-display-lg font-bold text-primary mb-sm">{tr('createAccountTitle')}</h1>
            <p className="text-body-md text-on-surface-variant">
              {tr('registerSubtitle')}
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
              {/* Buyer is the default; the server degrades anything else sent
                  here back to BUYER, so this control is a preference, not an
                  authority. */}
              <fieldset>
                <legend className="block text-label-sm font-bold text-on-surface-variant mb-xs">
                  {tr('whatBringsYou')}
                </legend>
                <div className="grid grid-cols-2 gap-md">
                  <label className="flex items-start gap-sm border border-outline-variant rounded-lg p-md cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                    <input type="radio" name="role" value="BUYER" checked={role === 'BUYER'} onChange={() => setRole('BUYER')} className="mt-1 accent-current" />
                    <span>
                      <span className="block font-bold text-body-md text-primary">{tr('wantToBuy')}</span>
                      <span className="block text-body-sm text-on-surface-variant">{tr('wantToBuyDesc')}</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-sm border border-outline-variant rounded-lg p-md cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                    <input type="radio" name="role" value="SELLER" checked={role === 'SELLER'} onChange={() => setRole('SELLER')} className="mt-1 accent-current" />
                    <span>
                      <span className="block font-bold text-body-md text-primary">{tr('wantToSell')}</span>
                      <span className="block text-body-sm text-on-surface-variant">{tr('wantToSellDesc')}</span>
                    </span>
                  </label>
                </div>
              </fieldset>

              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label htmlFor="firstName" className="block text-label-sm font-bold text-on-surface-variant mb-xs">
                    {tr('firstNameLabel')}
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    autoComplete="given-name"
                    placeholder={tr('firstNamePlaceholder')}
                    className="w-full px-md py-md bg-surface-container-low border border-outline-variant rounded-xl text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-label-sm font-bold text-on-surface-variant mb-xs">
                    {tr('lastNameLabel')}
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder={tr('lastNamePlaceholder')}
                    className="w-full px-md py-md bg-surface-container-low border border-outline-variant rounded-xl text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-label-sm font-bold text-on-surface-variant mb-xs">
                  {tr('emailLabelRequired')}
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
                  {tr('passwordLabelRequired')}
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
                    placeholder={tr('passwordMinPlaceholder')}
                    className="w-full pl-xl pr-md py-md bg-surface-container-low border border-outline-variant rounded-xl text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-label-sm font-bold text-on-surface-variant mb-xs">
                  {tr('confirmPasswordLabel')}
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
                    placeholder={tr('confirmPasswordPlaceholder')}
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
                    {tr('creatingAccount')}
                  </>
                ) : (
                  <>
                    {tr('createAccountButton')}
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-xl pt-lg border-t border-outline-variant/30 text-center">
              <p className="text-body-sm text-on-surface-variant">
                {tr('alreadyHaveAccount')}{' '}
                <Link href="/login" className="text-primary font-bold hover:underline transition-all">
                  {tr('signInHere')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
