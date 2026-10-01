import { formatCurrency } from '@/lib/utils';
import { docFont } from '@/lib/doc-fonts';
import FitToWidth from '@/components/ui/FitToWidth';

// 見積書・請求書・発注請書・納品書の画面プレビュー。
// PDF テンプレート（src/lib/pdf/*）と同じ寸法（pt）で組み、A4 の幅（595pt ≒ 794px）を画面幅に合わせて縮小表示する。
// 文字サイズは src/lib/doc-fonts.ts を PDF と共有する。

const A4_WIDTH_PX = 794;
const COLOR = { title: '#817D7D', gray: '#727272', border: '#e3e3e3', tableHead: '#3c3d3a', totalBg: '#eeeeee' };

export interface PreviewSection {
  label: string;
  text: string | null | undefined;
  /** text: 備考・取引条件 / bank: 振込先（14px） */
  variant: 'text' | 'bank';
}

interface Props {
  title: string;
  docNumber: string;
  /** 右上の日付（PDF と同じ書式の文字列） */
  dateText: string;
  toLabel: string;
  customerName: string;
  lead?: string;
  infoRows: { label: string; value: string | null | undefined; valueClassName?: string }[];
  totalLabel: string;
  itemHeader: string;
  showTaxColumn: boolean;
  lineItems: {
    id: number; description: string; details: string | null;
    quantity: number; unitPrice: number; amount: number; taxRate: number;
  }[];
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  sections: PreviewSection[];
  companyInfo: {
    companyName: string; ownerName: string | null; postalCode: string | null;
    address: string | null; phone: string | null; registrationNumber: string | null;
    stampImage: string | null;
  } | null;
}

const num = (n: number) => n.toLocaleString('ja-JP');

export default function DocumentPreview({
  title, docNumber, dateText, toLabel, customerName, lead, infoRows, totalLabel, itemHeader, showTaxColumn,
  lineItems, subtotal, taxAmount, discount, total, sections, companyInfo,
}: Props) {
  const taxRates = Array.from(new Set(lineItems.map(i => i.taxRate ?? 10))).filter(r => r > 0);
  const taxLabel = taxRates.length === 1 ? `消費税 (${taxRates[0]}%)` : '消費税';
  const cellPad = { padding: '9pt 6pt' };
  const headPad = { padding: '6pt 6pt' };

  return (
    <FitToWidth width={A4_WIDTH_PX}>
      <div
        className="relative bg-white rounded-lg border border-gray-200 text-black"
        style={{ padding: '36pt 40pt 44pt', lineHeight: 1.6, ...docFont('lead') }}
      >
        {/* 右上: 番号・日付 */}
        <div className="absolute text-right" style={{ top: '36pt', right: '40pt' }}>
          <p className="font-medium" style={docFont('docNumber')}>{docNumber}</p>
          <p style={{ ...docFont('docNumber'), color: COLOR.gray, marginTop: '2pt' }}>{dateText}</p>
        </div>

        {/* タイトル */}
        <h1
          className="font-medium text-center"
          style={{ ...docFont('title'), color: COLOR.title, letterSpacing: '3pt', marginTop: '4pt', marginBottom: '30pt', lineHeight: 1.6 }}
        >
          {title}
        </h1>

        {/* ヘッダー 2カラム */}
        <div className="flex" style={{ marginBottom: '18pt' }}>
          {/* 左: 宛先 + 文言 + 案件情報 */}
          <div className="flex-1" style={{ paddingRight: '30pt' }}>
            <p style={{ ...docFont('toLabel'), color: COLOR.title, marginBottom: '3pt' }}>{toLabel}</p>
            <p className="font-medium" style={{ ...docFont('toCompany'), marginBottom: '18pt' }}>{customerName} 御中</p>
            {lead && <p style={{ ...docFont('lead'), marginBottom: '12pt' }}>{lead}</p>}

            {infoRows.filter(r => r.value).map((r, i) => (
              <div key={i} className="flex" style={{ marginBottom: '5pt' }}>
                <span className="shrink-0" style={{ ...docFont('infoLabel'), width: '56pt', color: COLOR.title }}>{r.label}</span>
                <span className="shrink-0" style={{ ...docFont('infoLabel'), width: '10pt', color: COLOR.title }}>:</span>
                <span className={`font-medium ${r.valueClassName ?? ''}`} style={docFont('infoValue')}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* 右: 自社情報 + 印鑑 + 印鑑枠 */}
          <div className="relative shrink-0" style={{ width: '170pt' }}>
            {companyInfo?.stampImage && (
              <>
                {/* 印鑑: 右端を枠にそろえ、テキストの背面に置く（PDF と同じ位置・大きさ） */}
                {/* eslint-disable-next-line @next/next/no-img-element -- data URL の印鑑画像 */}
                <img
                  src={companyInfo.stampImage}
                  alt="印鑑"
                  className="absolute object-contain pointer-events-none"
                  style={{ right: 0, top: '12pt', width: '48pt', height: '48pt', zIndex: 0 }}
                />
              </>
            )}
            {companyInfo?.companyName && (
              <div className="relative" style={{ zIndex: 1 }}>
                <p className="font-medium" style={{ ...docFont('companyName'), marginBottom: '4pt' }}>
                  {companyInfo.companyName}{companyInfo.ownerName ? `　${companyInfo.ownerName}` : ''}
                </p>
                {[
                  companyInfo.postalCode,
                  companyInfo.address,
                  companyInfo.phone && `電話番号 : ${companyInfo.phone}`,
                  companyInfo.registrationNumber && `登録番号 : ${companyInfo.registrationNumber}`,
                ].filter(Boolean).map((line, i) => (
                  <p key={i} style={{ ...docFont('companyLine'), color: COLOR.gray, marginBottom: '2pt', lineHeight: 1.5 }}>{line}</p>
                ))}
              </div>
            )}
            <div className="flex" style={{ marginTop: '8pt', height: '44pt' }}>
              {[0, 1, 2].map(i => (
                <div key={i} className="flex-1" style={{ border: '0.75pt solid #9CA3AF', marginLeft: i ? '-0.75pt' : 0 }} />
              ))}
            </div>
          </div>
        </div>

        {/* 金額バー（左カラムと同じ幅） */}
        <div className="flex" style={{ marginBottom: '30pt' }}>
          <div className="flex-1" style={{ paddingRight: '30pt' }}>
            <div
              className="flex justify-between items-center"
              style={{ borderBottom: '1.5pt solid #9CA3AF', padding: '4pt 0 7pt' }}
            >
              <span style={{ ...docFont('totalBarLabel'), color: COLOR.gray }}>{totalLabel}</span>
              <span className="font-medium" style={docFont('totalBarValue')}>{formatCurrency(total)}</span>
            </div>
          </div>
          <div className="shrink-0" style={{ width: '170pt' }} />
        </div>

        {/* 明細テーブル */}
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: COLOR.tableHead }}>
              <th className="text-left font-medium text-white" style={{ ...docFont('tableHead'), ...headPad }}>{itemHeader}</th>
              <th className="text-right font-medium text-white" style={{ ...docFont('tableHead'), ...headPad, width: '38pt' }}>数量</th>
              <th className="text-right font-medium text-white" style={{ ...docFont('tableHead'), ...headPad, width: showTaxColumn ? '64pt' : '72pt' }}>単価</th>
              {showTaxColumn && (
                <th className="text-right font-medium text-white" style={{ ...docFont('tableHead'), ...headPad, width: '44pt' }}>税(%)</th>
              )}
              <th className="text-right font-medium text-white" style={{ ...docFont('tableHead'), ...headPad, width: showTaxColumn ? '68pt' : '80pt' }}>総額</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item) => (
              <tr key={item.id} style={{ borderBottom: `0.5pt solid ${COLOR.border}` }}>
                <td className="align-top" style={cellPad}>
                  <div className="font-medium" style={{ ...docFont('itemName'), marginBottom: '3pt' }}>{item.description}</div>
                  {item.details && (
                    <div className="whitespace-pre-line" style={{ ...docFont('itemDetail'), color: COLOR.gray }}>{item.details}</div>
                  )}
                </td>
                <td className="align-top text-right" style={{ ...docFont('cell'), ...cellPad }}>
                  {item.quantity.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}
                </td>
                <td className="align-top text-right" style={{ ...docFont('cell'), ...cellPad }}>{num(item.unitPrice)}</td>
                {showTaxColumn && (
                  <td className="align-top text-right" style={{ ...docFont('cell'), ...cellPad, color: COLOR.gray }}>
                    {(item.taxRate ?? 10) === 0 ? '-' : `${item.taxRate ?? 10}`}
                  </td>
                )}
                <td className="align-top text-right" style={{ ...docFont('cell'), ...cellPad }}>{num(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 集計 */}
        <div className="flex flex-col items-end" style={{ marginTop: '6pt' }}>
          {[
            { label: '小計', value: num(subtotal) },
            { label: taxLabel, value: num(taxAmount) },
            ...(discount > 0 ? [{ label: '値引き', value: `(-) ${num(discount)}` }] : []),
          ].map((row) => (
            <div key={row.label} className="flex items-center" style={{ padding: '4pt 0' }}>
              <span className="text-right" style={{ ...docFont('totalLabel'), width: '110pt', paddingRight: '12pt', color: COLOR.gray }}>{row.label}</span>
              <span className="text-right" style={{ ...docFont('totalValue'), width: '80pt', paddingRight: '6pt' }}>{row.value}</span>
            </div>
          ))}
          <div className="flex items-center" style={{ backgroundColor: COLOR.totalBg, padding: '6pt', marginTop: '4pt' }}>
            <span className="text-right font-medium" style={{ ...docFont('totalLabel'), width: '110pt', paddingRight: '12pt' }}>総額</span>
            <span className="text-right font-medium" style={{ ...docFont('grandValue'), width: '80pt' }}>¥{num(total)}</span>
          </div>
        </div>

        {/* 振込先・備考・取引条件 */}
        {sections.filter(sec => sec.text).map((sec) => (
          <div key={sec.label} style={{ marginTop: '16pt' }}>
            <p style={{ ...docFont('sectionLabel'), color: COLOR.title, marginBottom: '4pt' }}>{sec.label}</p>
            <p
              className="whitespace-pre-line text-left"
              style={{ ...docFont(sec.variant === 'bank' ? 'bankText' : 'noteText'), lineHeight: sec.variant === 'bank' ? 1.6 : 1.7 }}
            >
              {sec.text}
            </p>
          </div>
        ))}
      </div>
    </FitToWidth>
  );
}
