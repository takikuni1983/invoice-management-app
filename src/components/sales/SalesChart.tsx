'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

export interface SalesPoint {
  label: string;
  approved: number;
  invoiced: number;
}

// 系列色（dataviz の検証済みパレット: slot1 blue / slot2 orange）
const COLOR_APPROVED = '#2a78d6';
const COLOR_INVOICED = '#eb6834';

function formatAxis(value: number) {
  const fmt = (n: number) => n.toLocaleString('ja-JP', { maximumFractionDigits: 1 });
  if (value >= 100_000_000) return `${fmt(value / 100_000_000)}億`;
  if (value >= 10_000) return `${fmt(value / 10_000)}万`;
  return String(value);
}

export default function SalesChart({ data }: { data: SalesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2} barCategoryGap="20%">
        <CartesianGrid vertical={false} stroke="#f0f0ee" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
        <YAxis tickFormatter={formatAxis} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={52} />
        <Tooltip
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          formatter={(value, name) => [formatCurrency(Number(value)), name]}
          contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: '#e5e7eb' }}
          labelStyle={{ color: '#111827', fontWeight: 500 }}
          itemStyle={{ color: '#374151' }}
        />
        <Legend
          iconType="square"
          iconSize={10}
          wrapperStyle={{ fontSize: 12, color: '#374151' }}
          formatter={(value) => <span style={{ color: '#374151' }}>{value}</span>}
        />
        <Bar dataKey="approved" name="見積承認金額" fill={COLOR_APPROVED} radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="invoiced" name="請求金額" fill={COLOR_INVOICED} radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
