import Link from 'next/link';
import { Copy } from 'lucide-react';

// 詳細画面の「複製」: 内容をコピーした新規作成フォームを開く（保存するまで作成されない）
export default function DuplicateButton({ basePath, id }: { basePath: string; id: number }) {
  return (
    <Link
      href={`${basePath}/new?duplicate=${id}`}
      className="flex items-center gap-1 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
    >
      <Copy className="h-4 w-4" /> 複製
    </Link>
  );
}
