import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PwaRegister } from './pwa-register';

export const metadata: Metadata = {
  title: 'RANGA',
  description: 'Multi-agent poaching-risk command center powered by Gemma 4 via Cerebras.',
  applicationName: 'RANGA',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RANGA',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport = {
  themeColor: '#bdd7ff',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
