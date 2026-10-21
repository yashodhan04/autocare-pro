import { FormDialog } from '../../components/common/FormDialog.jsx';
import { PAYMENT_METHOD_OPTIONS } from '../../config/options.js';
import { post } from '../../services/api.js';
import { formatMoney } from '../../utils/format.js';

/** Manual payment entry. "TEST" payments are clearly labelled simulated transactions — no real gateway is used. */
export function PaymentDialog({ invoice, onClose, onDone }) {
  if (!invoice) return null;
  return (
    <FormDialog open onClose={onClose} size="sm" title={`Record payment — ${invoice.invoiceNo}`} description={`Outstanding balance ${formatMoney(invoice.balance)}. Payments are recorded manually; no payment gateway is connected.`}
      fields={[
        { name: 'amount', label: 'Amount (₹)', type: 'number', required: true, min: 0.01, step: '0.01', max: invoice.balance, span: 2 },
        { name: 'method', label: 'Method', type: 'select', required: true, options: PAYMENT_METHOD_OPTIONS, span: 2 },
        { name: 'reference', label: 'Reference / receipt no.', span: 2 },
      ]}
      initial={{ amount: invoice.balance, method: 'cash' }} submitLabel="Record payment"
      onSubmit={async (v) => { await post('/payments', { ...v, invoice: invoice._id }); onDone?.(); }} />
  );
}
