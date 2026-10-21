/** Round to 2 decimals using integer-cent arithmetic to avoid float drift. */
export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/**
 * Compute totals from lines [{quantity, unitPrice}] — single source of truth for
 * estimates and invoices. Tax is applied after the discount.
 */
export function computeTotals(lines, taxRate = 0, discount = 0) {
  const withAmounts = lines.map((l) => ({ ...l, amount: round2(l.quantity * l.unitPrice) }));
  const subtotal = round2(withAmounts.reduce((s, l) => s + l.amount, 0));
  const disc = Math.min(round2(discount), subtotal);
  const taxable = round2(subtotal - disc);
  const taxAmount = round2((taxable * taxRate) / 100);
  return { lines: withAmounts, subtotal, discount: disc, taxRate, taxAmount, total: round2(taxable + taxAmount) };
}
