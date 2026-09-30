'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  ChevronRight,
  Package,
  Settings,
  ClipboardCheck,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/customers', label: '顧客管理', icon: Users },
  { href: '/estimates', label: '見積書', icon: FileText },
  { href: '/orders', label: '発注請書', icon: ClipboardCheck },
  { href: '/invoices', label: '請求書', icon: Receipt },
  { href: '/items', label: '品目マスタ', icon: Package },
  { href: '/settings', label: '設定', icon: Settings },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-gray-900 text-white flex flex-col min-h-screen h-full overflow-y-auto">
      <div className="px-4 py-5 border-b border-gray-700 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">請求管理</h1>
          <p className="text-xs text-gray-400 mt-0.5">Invoice Manager</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 -mr-1 text-gray-400 hover:text-white" aria-label="メニューを閉じる">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
              {active && <ChevronRight className="h-3 w-3 ml-auto" />}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-gray-700 text-xs text-gray-500">
        © 2026 Invoice Manager
      </div>
    </aside>
  );
}
