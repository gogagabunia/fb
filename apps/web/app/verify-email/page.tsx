'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { verifyEmailAction, resendVerificationAction } from '../auth-actions';
import { makeT } from '../lib/i18n';
import { authStrings } from '../lib/i18n/auth';
import { useLang } from '../components/lang-provider';
import { LangSwitcher } from '../components/lang-switcher';

export default function VerifyEmailPage() {
  const lang = useLang();
  const tr = makeT(authStrings, lang);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // The email arrives as a query param from register/login. Read it after mount
  // (not useSearchParams) so the page needs no Suspense boundary — same pattern
  // as the register page's ?role handling.
  useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search).get('email') || '';
    setEmail(fromQuery);
    if (new URLSearchParams(window.location.search).get('resent') === '1') {
      setNotice(tr('needsVerificationNotice'));
    }
    // tr is stable enough for a mount-only read; intentionally run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!email) {
      setError(tr('verifyMissingEmail'));
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.set('email', email);
    formData.set('code', code.trim());

    try {
      const result = await verifyEmailAction(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
      // On success verifyEmailAction redirects — nothing to do here.
    } catch (err: any) {
      if (err?.digest?.includes('NEXT_REDIRECT')) return;
      setError(tr('genericError'));
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(null);
    setNotice(null);

    if (!email) {
      setError(tr('verifyMissingEmail'));
      return;
    }

    setResending(true);
    try {
      const result = await resendVerificationAction(email);
      if (result?.error) {
        setError(result.error);
      } else {
        setNotice(tr('codeResent'));
      }
    } catch {
      setError(tr('genericError'));
    } finally {
      setResending(false);
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

      {/* Verification Form */}
      <main className="flex-1 flex items-center justify-center px-lg py-xxl">
        <div className="w-full max-w-md">
          {/* Branding */}
          <div className="text-center mb-xl">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-lg shadow-lg">
              <span className="material-symbols-outlined text-on-secondary text-[32px]">mark_email_read</span>
            </div>
            <h1 className="text-display-lg font-bold text-primary mb-sm">{tr('verifyTitle')}</h1>
            <p className="text-body-md text-on-surface-variant">{tr('verifySubtitle')}</p>
            {email && <p className="text-body-sm text-primary font-bold mt-xs">{email}</p>}
          </div>

          {/* Form Card */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-lg p-xl">
            {error && (
              <div className="mb-lg p-md bg-error-container text-on-error-container rounded-lg flex items-center gap-sm text-label-md font-medium animate-bounce">
                <span className="material-symbols-outlined text-[20px]">error</span>
                {error}
              </div>
            )}
            {notice && !error && (
              <div className="mb-lg p-md bg-secondary-container text-on-secondary-container rounded-lg flex items-center gap-sm text-label-md font-medium">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                {notice}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-lg">
              <div>
                <label htmlFor="code" className="block text-label-sm font-bold text-on-surface-variant mb-xs">
                  {tr('verifyCodeLabel')}
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder={tr('verifyCodePlaceholder')}
                  className="w-full px-md py-md bg-surface-container-low border border-outline-variant rounded-xl text-title-lg tracking-[0.5em] text-center font-bold focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length < 6}
                className={`w-full py-md bg-secondary text-on-secondary rounded-xl font-headline-sm shadow-lg hover:shadow-xl hover:scale-[0.99] active:scale-[0.97] transition-all flex items-center justify-center gap-sm ${
                  loading || code.length < 6 ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                    {tr('verifying')}
                  </>
                ) : (
                  <>
                    {tr('verifyButton')}
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-xl pt-lg border-t border-outline-variant/30 text-center">
              <p className="text-body-sm text-on-surface-variant">
                {tr('didNotGetCode')}{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-primary font-bold hover:underline transition-all disabled:opacity-60"
                >
                  {resending ? tr('resendingCode') : tr('resendCode')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
