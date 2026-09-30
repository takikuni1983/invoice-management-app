import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} ${ibmPlex.variable} font-sans antialiased bg-gray-50`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 p-6 overflow-auto">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
