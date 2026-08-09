import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { getLang, LANG_COOKIE } from './lib/i18n';
import { LangProvider } from './components/lang-provider';

export const metadata: Metadata = {
  title: 'GroupMarket | Premium Community Marketplaces',
  description: 'Transform chaotic social media selling into a structured, searchable, and professional storefront.',
};

// Facebook scrapes (Apify sync run) take longer than the default 10s Hobby
// limit, so raise the function budget to the Hobby max. Cascades to routes and
// the server actions invoked from them.
export const maxDuration = 60;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = getLang((await cookies()).get(LANG_COOKIE)?.value);
  return (
    <html lang={lang} className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Georgian:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-on-surface font-sans selection:bg-secondary-container selection:text-on-secondary-container min-h-screen flex flex-col">
        <LangProvider lang={lang}>{children}</LangProvider>
      </body>
    </html>
  );
}
