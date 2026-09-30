'use client';

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/dashboard': 'ダッシュボード',
  '/customers': '顧客管理',
  '/customers/new': '顧客を新規登録',
  '/estimates': '見積書',
  '/estimates/new': '見積書を新規作成',
  '/invoices': '請求書',
  '/invoices/new': '請求書を新規作成',
  '/orders': '発注請書',
  '/orders/new': '発注請書を新規作成',
};

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const title =
    pageTitles[pathname] ??
    (pathname.includes('/edit')
      ? '編集'
      : pathname.includes('/estimates/')
      ? '見積書詳細'
      : pathname.includes('/invoices/')
      ? '請求書詳細'
      : pathname.includes('/orders/')
      ? '発注請書詳細'
      : pathname.includes('/customers/')
      ? '顧客詳細'
      : '');

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center gap-2 px-4 md:px-6 sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900"
        aria-label="メニューを開く"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
    </header>
  );
}
