import { formatMoney } from '../../utils/format.js';

/** Subtotal / discount / tax / total block shared by estimates and invoices. */
export function TotalsSummary({ subtotal, discount, taxRate, taxAmount, total, balance, amountPaid }) {
  const row = (label, value, strong) => (
    <div className={`flex justify-between gap-8 ${strong ? 'text-body font-bold text-text-primary pt-2 border-t border-border' : 'text-body-sm text-text-secondary'}`}><dt>{label}</dt><dd>{value}</dd></div>
  );
  return (
    <dl className="space-y-1.5 min-w-[16rem]">
      {row('Subtotal', formatMoney(subtotal))}
      {discount > 0 && row('Discount', `− ${formatMoney(discount)}`)}
      {row(`Tax${taxRate != null ? ` (${taxRate}%)` : ''}`, formatMoney(taxAmount))}
      {row('Total', formatMoney(total), true)}
      {amountPaid != null && row('Paid', formatMoney(amountPaid))}
      {balance != null && row('Balance due', formatMoney(balance))}
    </dl>
  );
}
