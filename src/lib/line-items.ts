// 見積書・請求書・発注請書で共通の明細／カスタム項目の整形と金額計算

export function buildLineItems(lineItems: any[] | undefined, defaultTaxRate = 10) {
  return (lineItems ?? []).map((item: any, i: number) => ({
    sortOrder: i,
    description: item.description ?? '',
    details: item.details || null,
    quantity: Number(item.quantity),
    unit: item.unit ?? '',
    unitPrice: Number(item.unitPrice),
    amount: Number(item.quantity) * Number(item.unitPrice),
    taxRate: Number(item.taxRate ?? defaultTaxRate),
  }));
}

export function calcTotals(items: { amount: number; taxRate: number }[], discount: unknown) {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = items.reduce((sum, item) => sum + Math.round(item.amount * item.taxRate / 100), 0);
  const discountAmount = Number(discount ?? 0) || 0;
  return { subtotal, taxAmount, discount: discountAmount, totalAmount: subtotal + taxAmount - discountAmount };
}

export function buildCustomFields(customFields: any[] | undefined) {
  return (customFields ?? [])
    .filter((cf: any) => cf?.label)
    .map((cf: any, i: number) => ({ label: cf.label, value: cf.value ?? '', sortOrder: i }));
}
