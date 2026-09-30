import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import AppShell from '@/components/layout/AppShell';

const inter = localFont({
  src: [
    { path: '../../public/fonts/InterVariable.ttf', style: 'normal' },
    { path: '../../public/fonts/InterVariable-Italic.ttf', style: 'italic' },
  ],
  variable: '--font-inter',
  display: 'swap',
});

const ibmPlex = localFont({
  src: [
    { path: '../../public/fonts/IBMPlexSansJP-Regular.ttf', weight: '400' },
    { path: '../../public/fonts/IBMPlexSansJP-Medium.ttf', weight: '500' },
  ],
  variable: '--font-ibm',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '請求管理システム',
  description: '見積書・請求書管理アプリケーション',
  appleWebApp: { capable: true, title: '請求管理', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#111827',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} ${ibmPlex.variable} font-sans antialiased bg-gray-50`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
