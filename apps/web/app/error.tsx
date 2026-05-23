'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to console
    console.error('GroupMarket Runtime Error Caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans selection:bg-secondary-container flex flex-col justify-between">
      {/* Header */}
      <nav className="bg-surface/85 backdrop-blur-md sticky top-0 z-50 border-b border-outline-variant/30 shadow-sm">
        <div className="flex justify-between items-center w-full px-md md:px-lg py-sm max-w-container-max mx-auto h-16">
          <Link href="/" className="text-title-lg md:text-headline-md font-bold text-primary">
            GroupMarket
          </Link>
          <Link href="/marketplace" className="text-on-surface-variant hover:text-primary transition-colors font-label-md">
            Browse Marketplace
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-md py-xxl relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-error-container/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="max-w-xl w-full text-center space-y-xl z-10">
          {/* Animated Error Icon Wrapper */}
          <div className="relative inline-flex mb-lg">
            <div className="absolute inset-0 rounded-full bg-error-container/20 animate-ping opacity-75"></div>
            <div className="relative w-28 h-28 bg-error-container/20 border border-error/20 rounded-full shadow-md flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-[56px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                warning
              </span>
            </div>
          </div>

          <div className="space-y-sm">
            <h1 className="text-display-md md:text-display-lg font-extrabold text-primary tracking-tight leading-tight">
              Something went wrong
            </h1>
            <p className="text-body-lg text-on-surface-variant max-w-md mx-auto leading-relaxed">
              An unexpected application error occurred while processing your request. Don't worry, your data is safe.
            </p>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row gap-md justify-center items-center">
            <button
              onClick={() => reset()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-xs bg-primary text-on-primary px-xxl py-md rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-md text-label-md"
            >
              <span className="material-symbols-outlined">refresh</span>
              Try Again
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-xs bg-surface-container-high hover:bg-surface-container-highest text-primary px-xxl py-md rounded-xl font-bold active:scale-[0.98] transition-all border border-outline-variant/30 text-label-md"
            >
              <span className="material-symbols-outlined">home</span>
              Go Home
            </Link>
          </div>

          {/* Collapsible Technical Details for Admins */}
          <div className="text-left w-full">
            <details className="group border border-outline-variant/30 rounded-xl bg-surface-container-low overflow-hidden transition-all duration-300">
              <summary className="flex justify-between items-center p-md cursor-pointer hover:bg-surface-container-high transition-colors select-none">
                <span className="font-bold text-body-sm text-primary flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[18px]">terminal</span>
                  Technical Details (for administrators)
                </span>
                <span className="material-symbols-outlined text-[20px] transition-transform group-open:rotate-180">
                  keyboard_arrow_down
                </span>
              </summary>
              <div className="p-md border-t border-outline-variant/30 bg-surface-container-lowest font-mono text-[11px] text-error overflow-x-auto max-h-48 whitespace-pre-wrap leading-relaxed select-all">
                <p className="font-bold mb-xs">Error Name: {error?.name || 'Runtime Error'}</p>
                <p className="font-bold mb-md">Message: {error?.message || 'No descriptive message provided.'}</p>
                {error?.digest && <p className="mb-md font-semibold text-slate-500">Digest: {error.digest}</p>}
                <p className="text-[10px] text-on-surface-variant font-sans">
                  The error was captured locally. If this persists, please contact GroupMarket customer support with the above details.
                </p>
              </div>
            </details>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/30 py-lg mt-xxl text-center text-xs text-on-surface-variant/60">
        <div className="max-w-container-max mx-auto px-lg">
          © {new Date().getFullYear()} GroupMarket Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
