import {
  cn,
  ESTIMATE_STATUS_LABELS, ESTIMATE_STATUS_COLORS,
  INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS,
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS,
} from '@/lib/utils';

interface Props {
  status: string;
  type: 'estimate' | 'invoice' | 'order';
}

const MAPS = {
  estimate: { labels: ESTIMATE_STATUS_LABELS, colors: ESTIMATE_STATUS_COLORS },
  invoice:  { labels: INVOICE_STATUS_LABELS,  colors: INVOICE_STATUS_COLORS },
  order:    { labels: ORDER_STATUS_LABELS,    colors: ORDER_STATUS_COLORS },
};

export default function StatusBadge({ status, type }: Props) {
  const { labels, colors } = MAPS[type];

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', colors[status])}>
      {labels[status] ?? status}
    </span>
  );
}
