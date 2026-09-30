'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export interface CustomFieldRow { label: string; value: string; }

interface Props {
  fields: CustomFieldRow[];
  onChange: (fields: CustomFieldRow[]) => void;
}

// 設定 > カスタム項目 で登録したラベルから項目を追加して値を入力する
export default function CustomFieldsEditor({ fields, onChange }: Props) {
  const [fieldLabels, setFieldLabels] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings/fields');
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) setFieldLabels(data.map((d: any) => d.label));
      } catch {}
    })();
  }, []);

  function addField(label: string) {
    if (!label || fields.some(cf => cf.label === label)) return;
    onChange([...fields, { label, value: '' }]);
  }

  function updateField(index: number, value: string) {
    onChange(fields.map((cf, i) => i === index ? { ...cf, value } : cf));
  }

  function removeField(index: number) {
    onChange(fields.filter((_, i) => i !== index));
  }

  const unusedLabels = fieldLabels.filter(l => !fields.some(cf => cf.label === l));

  if (fields.length === 0 && unusedLabels.length === 0) return null;

  return (
    <div className="pt-2 space-y-2">
      <p className="text-sm font-medium text-gray-700">カスタム項目</p>
      {fields.map((cf, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-sm text-gray-600 w-32 shrink-0">{cf.label}</span>
          <input
            value={cf.value}
            onChange={(e) => updateField(i, e.target.value)}
            placeholder={cf.label}
            className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="button" onClick={() => removeField(i)} className="p-1 text-gray-400 hover:text-red-500">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      {unusedLabels.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {unusedLabels.map(label => (
            <button
              key={label}
              type="button"
              onClick={() => addField(label)}
              className="flex items-center gap-1 text-xs px-2 py-1 border border-dashed border-blue-400 text-blue-600 rounded hover:bg-blue-50"
            >
              <Plus className="h-3 w-3" /> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
