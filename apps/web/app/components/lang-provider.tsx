'use client';

import { createContext, useContext } from 'react';
import type { Lang } from '../lib/i18n';

/**
 * Carries the viewer's language (from the lang cookie, read once in the root
 * layout) down to client components. Client pages call useLang() instead of
 * reading document.cookie, which would mismatch the server-rendered HTML.
 */
const LangContext = createContext<Lang>('ka');

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}
