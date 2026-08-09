'use client';

import { useState } from 'react';
import Link from 'next/link';
import { logoutAction } from '../auth-actions';
import { makeT } from '../lib/i18n';
import { sidebarStrings } from '../lib/i18n/sidebar';
import { useLang } from './lang-provider';
import { LangSwitcher } from './lang-switcher';

interface User {
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface SidebarProps {
  activePage: 'dashboard' | 'admin' | 'add-group' | 'marketplace' | string;
  user: User | null;
  onSync?: () => void | Promise<void>;
  syncing?: boolean;
}

export default function Sidebar({ activePage, user, onSync, syncing = false }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const lang = useLang();
  const tr = makeT(sidebarStrings, lang);

  const navLinks = [
    { id: 'dashboard', label: tr('navDashboard'), icon: 'dashboard', href: '/dashboard' },
    { id: 'analytics', label: tr('navAnalytics'), icon: 'analytics', href: '/dashboard/analytics' },
    { id: 'moderation', label: tr('navModeration'), icon: 'gavel', href: '/dashboard/moderation' },
    { id: 'add-group', label: tr('navGroups'), icon: 'groups', href: '/add-group' },
    { id: 'favorites', label: tr('navFavorites'), icon: 'favorite', href: '/favorites' },
    { id: 'settings', label: tr('navSettings'), icon: 'settings', href: '/settings' },
    { id: 'marketplace', label: tr('navMarketplace'), icon: 'storefront', href: '/marketplace' },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface p-md gap-xs">
      <div className="mb-xl px-xs py-sm">
        <h1 className="text-headline-sm font-bold text-primary">GroupMarket</h1>
        <p className="text-body-sm text-on-surface-variant font-medium truncate">
          {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : tr('sellerPortal')}
        </p>
      </div>
      <nav className="flex-grow flex flex-col gap-xs">
        {navLinks.map((link) => {
          const isActive = activePage === link.id;
          return (
            <Link
              key={link.id}
              className={`flex items-center gap-md px-md py-sm rounded-lg transition-all ${
                isActive
                  ? 'bg-secondary-container text-on-secondary-container font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
              }`}
              href={link.href}
              onClick={() => setIsOpen(false)}
            >
              <span className="material-symbols-outlined">{link.icon}</span>
              <span className="text-label-md">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sync Button */}
      {onSync && (
        <button
          onClick={() => {
            onSync();
            setIsOpen(false);
          }}
          disabled={syncing}
          className={`mt-lg mb-md w-full py-md bg-primary text-on-primary rounded-lg text-label-md font-bold shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-xs ${
            syncing ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
          }`}
        >
          <span className={`material-symbols-outlined ${syncing ? 'animate-spin' : ''}`}>sync</span>
          {syncing ? tr('syncingPosts') : tr('syncNewPosts')}
        </button>
      )}

      <div className="border-t border-outline-variant/30 pt-md flex flex-col gap-xs">
        <span className="text-[11px] text-slate-400 font-semibold uppercase px-md mb-xs">{tr('databaseEngine')}</span>
        <div className="flex items-center gap-sm px-md py-xs text-xs text-emerald-600 font-bold bg-emerald-50 rounded-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          {tr('liveDb')}
        </div>
        <div className="flex justify-center mt-sm">
          <LangSwitcher current={lang} />
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="mt-sm w-full py-sm text-on-surface-variant hover:bg-error-container hover:text-on-error-container rounded-lg text-label-md font-medium transition-all flex items-center justify-center gap-xs"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            {tr('signOut')}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden w-full bg-surface border-b border-outline-variant/30 px-md py-sm flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-sm">
          <button
            onClick={() => setIsOpen(true)}
            className="p-xs hover:bg-surface-container-high rounded-full transition-all text-on-surface"
            aria-label={tr('openMenu')}
          >
            <span className="material-symbols-outlined text-[28px]">menu</span>
          </button>
          <h1 className="text-title-lg font-bold text-primary">GroupMarket</h1>
        </div>
        <p className="text-body-sm text-on-surface-variant font-medium max-w-[150px] truncate">
          {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : tr('sellerPortal')}
        </p>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-surface border-r border-outline-variant/30 flex-col shrink-0 h-full">
        {sidebarContent}
      </aside>

      {/* Mobile Navigation Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Drawer Sheet */}
          <div className="relative w-64 max-w-[80vw] h-full bg-surface flex flex-col shadow-2xl transition-transform duration-300 ease-out">
            {/* Close Button Inside Drawer */}
            <div className="absolute top-sm right-sm z-50">
              <button
                onClick={() => setIsOpen(false)}
                className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all"
                aria-label={tr('closeMenu')}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="h-full overflow-y-auto">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
