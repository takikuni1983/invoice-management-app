// 書類（見積書・請求書・発注請書・納品書）の文字サイズ（単位: pt）
// PDF テンプレートと画面のプレビューの両方でこの値を使い、見え方をそろえる。
// 画面では `${pt}pt` で指定する（1pt = 1.333px。A4 幅 595pt ≒ 画面の書類幅 768px なので比率もほぼ同じ）
export const DOC_FONT = {
  title: 24,          // 見積書・請求書などのタイトル
  docNumber: 9.75,    // 右上の番号・日付（13px）
  toLabel: 9,         // 「送付先」「請求先」（12px）
  toCompany: 9.5,     // 〇〇 御中
  lead: 8,            // 「下記の通り〜」
  infoLabel: 9,       // 件名・カスタム項目の見出し（12px）
  infoValue: 9.5,     // 件名・カスタム項目の値
  companyName: 9.5,   // 自社名・氏名
  companyLine: 9.75,  // 自社の住所・電話・登録番号（13px）
  totalBarLabel: 9,   // 金額バーの「総額」「発注金額」など（件名の見出しと同じ）
  totalBarValue: 13,  // 金額バーの金額
  tableHead: 9,       // 明細の見出し
  itemName: 8,        // 明細の品目名
  itemDetail: 7,      // 明細の注釈
  cell: 8,            // 明細の数量・単価・金額
  totalLabel: 10.5,   // 小計・消費税・値引き・総額の見出し（14px）
  totalValue: 8,      // 小計・消費税・値引きの金額（明細と同じ）
  grandValue: 8,      // 総額の金額
  sectionLabel: 9,    // 備考・取引条件・振込先の見出し（件名の見出しと同じ）
  noteText: 8,        // 備考・取引条件の本文（明細の品目名と同じ）
  bankText: 10.5,     // 振込先の本文（14px）
} as const;

export type DocFontKey = keyof typeof DOC_FONT;

/** 画面用: style={docFont('itemName')} */
export function docFont(key: DocFontKey): { fontSize: string } {
  return { fontSize: `${DOC_FONT[key]}pt` };
}
