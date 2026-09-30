'use client';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** 空欄のときに自動で振られる番号（表示用） */
  suggested?: string;
}

// 書類番号: 空欄なら保存時に自動採番、入力すればその番号を使う
export default function DocNumberField({ label, value, onChange, suggested }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={suggested ? `${suggested}（自動）` : '空欄なら自動で採番'}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <p className="text-xs text-gray-400 mt-1">空欄のまま保存すると自動で採番されます</p>
    </div>
  );
}
