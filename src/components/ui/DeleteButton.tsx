'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface Props {
  id: number;
  type: 'customers' | 'estimates' | 'invoices' | 'orders' | 'delivery-notes';
  label?: string;
  redirectTo?: string;
}

export default function DeleteButton({ id, type, label, redirectTo }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('削除してもよろしいですか？')) return;
    setDeleting(true);
    try {
      await fetch(`/api/${type}/${id}`, { method: 'DELETE' });
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs px-2 py-1 border border-red-200 rounded hover:bg-red-50 text-red-600 disabled:opacity-50 flex items-center gap-1"
    >
      <Trash2 className="h-3 w-3" />
      {label ?? '削除'}
    </button>
  );
}
