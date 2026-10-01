'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

// PC: 左に固定サイドバー / スマホ: ヘッダーの「≡」で開くドロワー
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // ページを移動したらドロワーを閉じる
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex shadow-xl">
            <Sidebar onClose={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setMenuOpen(true)} />
        {/* overflow-x-clip: 横はみ出しは隠しつつスクロール領域にしない（詳細画面の一覧カラムの sticky をウィンドウ基準で効かせる） */}
        <main className="flex-1 p-4 md:p-6 overflow-x-clip">{children}</main>
      </div>
    </div>
  );
}
