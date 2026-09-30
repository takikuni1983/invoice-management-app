import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatDate, formatCurrency } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import DeleteButton from '@/components/ui/DeleteButton';
import ConvertToInvoiceButton from '@/components/estimates/ConvertToInvoiceButton';
import { Edit, Download, ClipboardCheck } from 'lucide-react';

export default async function EstimateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [estimate, companyInfo] = await Promise.all([
    prisma.estimate.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
        lineItems: { orderBy: { sortOrder: 'asc' } },
        customFields: { orderBy: { sortOrder: 'asc' } },
        orderAcceptances: { select: { id: true, orderNumber: true }, orderBy: { createdAt: 'asc' } },
      },
    }),
    prisma.companyInfo.findUnique({ where: { id: 1 } }).catch(() => null),
  ]);

  if (!estimate) notFound();

  const subtotal = estimate.subtotal;
  const taxAmount = estimate.taxAmount;
  const discount = estimate.discount ?? 0;
  const total = estimate.totalAmount;

  const taxByRate: Record<number, number> = {};
  estimate.lineItems.forEach((item: any) => {
    const rate = item.taxRate ?? 10;
    taxByRate[rate] = (taxByRate[rate] ?? 0) + Math.round(item.amount * rate / 100);
  });
  const taxRates = Object.keys(taxByRate).map(Number).filter(r => r > 0);
  const taxLabel = taxRates.length === 1 ? `消費税 (${taxRates[0]}%)` : '消費税';

  return (
    <div className="max-w-3xl space-y-4">
      {/* アクションバー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-medium text-gray-900">{estimate.estimateNumber}</h2>
          <StatusBadge status={estimate.status} type="estimate" />
          {estimate.orderAcceptances.map((o) => (
            <Link key={o.id} href={`/orders/${o.id}`} className="text-xs text-gray-500 hover:underline">
              発注請書: {o.orderNumber}
            </Link>
          ))}
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/estimates/${estimate.id}/pdf`}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
          >
            <Download className="h-4 w-4" /> PDF
          </a>
          <Link
            href={`/orders/new?estimateId=${estimate.id}`}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
          >
            <ClipboardCheck className="h-4 w-4" /> 発注請書を作成
          </Link>
          {estimate.status !== 'INVOICED' && (
            <ConvertToInvoiceButton estimateId={estimate.id} />
          )}
          <Link
            href={`/estimates/${estimate.id}/edit`}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50"
          >
            <Edit className="h-4 w-4" /> 編集
          </Link>
          <DeleteButton id={estimate.id} type="estimates" redirectTo="/estimates" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8">

        {/* 右上: 見積番号・発行日 */}
        <div className="flex justify-end mb-2">
          <div className="text-right">
            <p className="font-medium text-[13px]">{estimate.estimateNumber}</p>
            <p className="text-[13px] text-gray-500">{formatDate(estimate.issueDate.toISOString())}</p>
          </div>
        </div>

        {/* タイトル */}
        <h1 className="text-3xl font-medium text-center mb-6" style={{ color: '#817D7D', letterSpacing: '0.15em' }}>見積書</h1>

        {/* ヘッダー + 総額バーを1つのflex行にまとめる（右カラム下端を総額バーに揃える） */}
        <div className="flex gap-12 mb-10">
          {/* 左カラム: 送付先 + 有効期限 + 件名 + カスタムフィールド + 総額バー */}
          <div style={{ flex: '0 1 55%' }} className="flex flex-col">
            <div className="flex-1">
              <p className="text-xs mb-1" style={{ color: '#817D7D' }}>送付先</p>
              <p className="text-sm font-medium mb-6">{estimate.customer.companyName} 御中</p>

              {estimate.expiryDate && (
                <div className="flex gap-2 mb-2 text-sm">
                  <span className="w-16 shrink-0" style={{ color: '#817D7D' }}>有効期限</span>
                  <span className="text-gray-300 shrink-0">:</span>
                  <span className="font-medium">{formatDate(estimate.expiryDate.toISOString())}</span>
                </div>
              )}

              {estimate.subject && (
                <div className="flex gap-2 mb-2 text-sm">
                  <span className="w-16 shrink-0" style={{ color: '#817D7D' }}>件名</span>
                  <span className="text-gray-300 shrink-0">:</span>
                  <span className="font-medium">{estimate.subject}</span>
                </div>
              )}

              {(estimate as any).customFields?.map((f: any) => (
                <div key={f.id} className="flex gap-2 mb-2 text-sm">
                  <span className="w-16 shrink-0" style={{ color: '#817D7D' }}>{f.label}</span>
                  <span className="text-gray-300 shrink-0">:</span>
                  <span className="font-medium">{f.value}</span>
                </div>
              ))}
            </div>

            {/* 総額バー */}
            <div className="flex justify-between items-center border-b-2 border-gray-400 py-2 mt-4">
              <span className="text-sm text-gray-500">総額</span>
              <span className="text-xl font-medium">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* 右カラム: 自社情報 + 電子印鑑 + 印鑑枠（右端まで・下端を総額バーに揃える） */}
          <div className="flex-1 flex flex-col justify-between text-sm">
            <div>
              {companyInfo?.companyName && (
                <div className="space-y-1 mb-2">
                  <p className="font-medium">
                    <span className="relative inline-block">
                      {companyInfo.companyName}{companyInfo.ownerName ? `　${companyInfo.ownerName}` : ''}
                      {companyInfo.stampImage && (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element -- data URL の印鑑画像 */}
                          <img
                            src={companyInfo.stampImage}
                            alt="印鑑"
                            className="absolute left-full top-1/2 -translate-y-1/2 -ml-2 w-14 h-14 max-w-none object-contain pointer-events-none z-10"
                          />
                        </>
                      )}
                    </span>
                  </p>
                  {companyInfo.postalCode    && <p className="text-xs text-gray-500">{companyInfo.postalCode}</p>}
                  {companyInfo.address       && <p className="text-xs text-gray-500">{companyInfo.address}</p>}
                  {companyInfo.phone         && <p className="text-xs text-gray-500">電話番号 : {companyInfo.phone}</p>}
                  {companyInfo.registrationNumber && (
                    <p className="text-xs text-gray-500">登録番号 : {companyInfo.registrationNumber}</p>
                  )}
                </div>
              )}
            </div>
            {/* 印鑑枠 */}
            <div className="flex gap-1 mt-2">
              <div className="flex-1 border border-gray-300" style={{ height: '44px' }} />
              <div className="flex-1 border border-gray-300" style={{ height: '44px' }} />
              <div className="flex-1 border border-gray-300" style={{ height: '44px' }} />
            </div>
          </div>
        </div>

        {/* 明細テーブル */}
        <table className="w-full text-sm mb-2">
          <thead>
            <tr style={{ backgroundColor: '#3c3d3a' }}>
              <th className="text-left px-3 py-2 font-medium text-white" style={{ fontSize: '9pt' }}>項目 &amp; 詳細</th>
              <th className="text-right px-3 py-2 font-medium text-white w-16" style={{ fontSize: '9pt' }}>数量</th>
              <th className="text-right px-3 py-2 font-medium text-white w-24" style={{ fontSize: '9pt' }}>単価</th>
              <th className="text-right px-3 py-2 font-medium text-white w-20" style={{ fontSize: '9pt' }}>税(%)</th>
              <th className="text-right px-3 py-2 font-medium text-white w-28" style={{ fontSize: '9pt' }}>総額</th>
            </tr>
          </thead>
          <tbody>
            {estimate.lineItems.map((item) => (
              <tr key={item.id} className="border-b bg-white" style={{ borderColor: '#e3e3e3' }}>
                <td className="px-3 py-3">
                  <div className="font-medium" style={{ fontSize: '8pt' }}>{item.description}</div>
                  {(item as any).details && (
                    <div className="mt-1 leading-relaxed whitespace-pre-line" style={{ fontSize: '7pt', color: '#727272' }}>
                      {(item as any).details}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 text-right" style={{ fontSize: '8pt' }}>{item.quantity}</td>
                <td className="px-3 py-3 text-right" style={{ fontSize: '8pt' }}>
                  {item.unitPrice.toLocaleString('ja-JP')}
                </td>
                <td className="px-3 py-3 text-right" style={{ fontSize: '8pt', color: '#727272' }}>
                  {((item as any).taxRate ?? 10) === 0 ? '-' : `${(item as any).taxRate ?? 10}`}
                </td>
                <td className="px-3 py-3 text-right font-medium" style={{ fontSize: '8pt' }}>
                  {item.amount.toLocaleString('ja-JP')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 集計 */}
        <div className="flex justify-end mt-2">
          <div style={{ minWidth: '16rem' }}>
            <div className="flex justify-between py-1.5 text-xs">
              <span className="pr-6" style={{ color: '#727272' }}>小計</span>
              <span className="pr-3">{subtotal.toLocaleString('ja-JP')}</span>
            </div>
            <div className="flex justify-between py-1.5 text-xs">
              <span className="pr-6" style={{ color: '#727272' }}>{taxLabel}</span>
              <span className="pr-3">{taxAmount.toLocaleString('ja-JP')}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between py-1.5 text-xs">
                <span className="pr-6" style={{ color: '#727272' }}>値引き</span>
                <span className="pr-3">(-) {discount.toLocaleString('ja-JP')}</span>
              </div>
            )}
            <div className="flex justify-between py-2 px-3 font-medium mt-1 text-sm" style={{ backgroundColor: '#eeeeee' }}>
              <span>総額</span>
              <span>¥{total.toLocaleString('ja-JP')}</span>
            </div>
          </div>
        </div>

        {/* 備考・取引条件 */}
        {estimate.notes && (
          <div className="mt-6">
            <p className="text-xs border-b pb-1 mb-2" style={{ color: '#817D7D', borderColor: '#e3e3e3' }}>備考</p>
            <p className="text-sm bg-gray-50 rounded p-3 leading-relaxed">{estimate.notes}</p>
          </div>
        )}
        {estimate.terms && (
          <div className="mt-4">
            <p className="text-xs border-b pb-1 mb-2" style={{ color: '#817D7D', borderColor: '#e3e3e3' }}>取引条件</p>
            <p className="text-sm leading-relaxed">{estimate.terms}</p>
          </div>
        )}
      </div>
    </div>
  );
}
