import { format } from 'date-fns';

// PDF のファイル名: {日付 yyyymmdd}_{番号}.pdf（例: 20260929_EST-000737.pdf）
export function pdfFilename(date: Date | string, number: string): string {
  const d = date instanceof Date ? date : new Date(date);
  // Windows などで使えない文字は _ に置き換える
  const safeNumber = number.replace(/[\\/:*?"<>|]/g, '_');
  return `${format(d, 'yyyyMMdd')}_${safeNumber}.pdf`;
}

/** Content-Disposition ヘッダー。日本語などを含む番号でも正しく保存できるよう filename* も付ける */
export function pdfContentDisposition(date: Date | string, number: string): string {
  const name = pdfFilename(date, number);
  const ascii = name.replace(/[^\x20-\x7e]/g, '_');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}
