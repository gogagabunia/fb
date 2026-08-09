'use client';

import { useRouter } from 'next/navigation';
import { LANG_COOKIE, type Lang } from '../lib/i18n';

/**
 * ქარ | EN toggle. Writes the cookie and refreshes so the server component
 * re-renders in the chosen language — no client-side string swapping.
 */
export function LangSwitcher({ current }: { current: Lang }) {
  const router = useRouter();

  function setLang(lang: Lang) {
    if (lang === current) return;
    document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  const base = 'px-sm py-1 rounded-md text-label-md transition-colors';
  return (
    <div className="flex items-center border border-outline-variant/60 rounded-lg p-0.5" role="group" aria-label="Language">
      <button
        type="button"
        onClick={() => setLang('ka')}
        className={`${base} ${current === 'ka' ? 'bg-surface-container-high font-bold text-primary' : 'text-on-surface-variant hover:text-primary'}`}
      >
        ქარ
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`${base} ${current === 'en' ? 'bg-surface-container-high font-bold text-primary' : 'text-on-surface-variant hover:text-primary'}`}
      >
        EN
      </button>
    </div>
  );
}
