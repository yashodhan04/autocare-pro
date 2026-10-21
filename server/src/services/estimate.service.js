import { computeTotals } from '../utils/money.js';

/** Apply server-side totals to an estimate document/plain object (never trust client totals). */
export function applyEstimateTotals(est, { lines, taxRate, discount }) {
  const t = computeTotals(lines, taxRate, discount);
  est.lines = t.lines;
  est.subtotal = t.subtotal;
  est.discount = t.discount;
  est.taxRate = t.taxRate;
  est.taxAmount = t.taxAmount;
  est.total = t.total;
  return est;
}
