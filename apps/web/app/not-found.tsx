'use client';

import Link from 'next/link';

export default function NotFound() {
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

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center px-md py-xxl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary-container/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="max-w-xl w-full text-center space-y-xl z-10">
          {/* Animated Float Icon Wrapper */}
          <div className="inline-flex justify-center items-center w-28 h-28 bg-surface-container-high border border-outline-variant/30 rounded-full shadow-md animate-float relative mb-lg">
            <span className="material-symbols-outlined text-[56px] text-primary">explore_off</span>
            <span className="absolute -top-xs -right-xs bg-error text-on-error w-8 h-8 rounded-full flex items-center justify-center font-bold text-label-sm shadow">
              404
            </span>
          </div>

          <div className="space-y-sm">
            <h1 className="text-display-md md:text-display-lg font-extrabold text-primary tracking-tight leading-tight">
              Lost in the Grid?
            </h1>
            <p className="text-body-lg text-on-surface-variant max-w-md mx-auto leading-relaxed">
              We couldn't find the page or listing you were searching for. It may have been relocated, archived, or deleted.
            </p>
          </div>

          {/* Premium Glassmorphic Options Card */}
          <div className="glass-card p-xl rounded-2xl shadow-lg border border-outline-variant/30 text-left space-y-md">
            <h3 className="text-title-md font-bold text-primary flex items-center gap-xs">
              <span className="material-symbols-outlined text-secondary">explore</span>
              Navigation Helper
            </h3>
            <p className="text-body-sm text-on-surface-variant">
              Here are some quick shortcuts to get you back on track:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md pt-xs">
              <Link
                href="/marketplace"
                className="flex items-center gap-md p-md bg-surface-container-lowest border border-outline-variant/20 rounded-xl hover:border-primary/30 transition-all hover:shadow-sm"
              >
                <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">storefront</span>
                </div>
                <div>
                  <span className="font-bold text-body-md text-primary block">Marketplace</span>
                  <span className="text-[11px] text-on-surface-variant block">Browse approved listings</span>
                </div>
              </Link>

              <Link
                href="/dashboard"
                className="flex items-center gap-md p-md bg-surface-container-lowest border border-outline-variant/20 rounded-xl hover:border-primary/30 transition-all hover:shadow-sm"
              >
                <div className="w-10 h-10 bg-secondary/5 rounded-lg flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined">dashboard</span>
                </div>
                <div>
                  <span className="font-bold text-body-md text-primary block">Seller Dashboard</span>
                  <span className="text-[11px] text-on-surface-variant block">Manage syncs & logs</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Back Home CTA Button */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-xs bg-primary text-on-primary px-xxl py-md rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-md text-label-md"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Go to Home Page
            </Link>
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
