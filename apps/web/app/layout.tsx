import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GroupMarket | Premium Community Marketplaces',
  description: 'Transform chaotic social media selling into a structured, searchable, and professional storefront.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-on-surface font-sans selection:bg-secondary-container selection:text-on-secondary-container min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
