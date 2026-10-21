const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/** Live preview only — the server recomputes and stores the authoritative totals (tax applies after discount). */
export function previewTotals(lines, taxRate = 0, discount = 0) {
  const subtotal = round2(lines.reduce((s, l) => s + round2((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0)), 0));
  const disc = Math.min(round2(Number(discount) || 0), subtotal);
  const taxAmount = round2(((subtotal - disc) * (Number(taxRate) || 0)) / 100);
  return { subtotal, discount: disc, taxAmount, total: round2(subtotal - disc + taxAmount) };
}
