import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Printer, CreditCard, Ban } from 'lucide-react';
import { Page } from '../components/common/Page.jsx';
import { LinkButton } from '../components/common/LinkButton.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { TotalsSummary } from '../features/jobs/TotalsSummary.jsx';
import { PaymentDialog } from '../features/jobs/PaymentDialog.jsx';
import { SectionCard } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { ConfirmDialog, ErrorState } from '../components/ui/States.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { post, parseError } from '../services/api.js';
import { formatDate, formatDateTime, formatMoney, humanize } from '../utils/format.js';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const res = useFetch(`/invoices/${id}`);
  const toast = useToast();
  const { hasRole } = useAuth();
  const canPay = hasRole('super_admin', 'workshop_admin', 'cashier');
  const [pay, setPay] = useState(false);
  const [voiding, setVoiding] = useState(false);

  if (res.loading && !res.data) return <Page><Skeleton className="h-8 w-60" /><Skeleton className="h-96 w-full" /></Page>;
  if (res.error) return <Page><ErrorState title="Invoice not found" message={res.error} /></Page>;
  const inv = res.data;
  const labour = inv.lines.filter((l) => l.kind === 'labour');
  const parts = inv.lines.filter((l) => l.kind === 'part');

  const Group = ({ title, lines }) => lines.length === 0 ? null : (
    <>
      <tr className="bg-surface-muted/50"><th colSpan={4} scope="colgroup" className="px-4 py-2 text-left text-overline uppercase text-text-muted">{title}</th></tr>
      {lines.map((l, i) => <tr key={i} className="border-b border-border"><td className="px-4 py-2.5">{l.description}</td><td className="px-4 py-2.5 text-right">{l.quantity}</td><td className="px-4 py-2.5 text-right">{formatMoney(l.unitPrice)}</td><td className="px-4 py-2.5 text-right font-medium">{formatMoney(l.amount)}</td></tr>)}
    </>
  );

  return (
    <Page title={<span className="font-mono">{inv.invoiceNo}</span>} badge={<StatusBadge status={inv.status} size="md" />} description={`Job ${inv.job?.jobNo}`}
      actions={<>
        <LinkButton to="/app/invoices" variant="outline" size="sm" icon={<ArrowLeft size={15} />}>All invoices</LinkButton>
        <Button variant="outline" size="sm" icon={<Printer size={15} />} onClick={() => window.print()}>Print</Button>
        {canPay && inv.balance > 0 && inv.status !== 'void' && <Button size="sm" icon={<CreditCard size={15} />} onClick={() => setPay(true)}>Record payment</Button>}
        {hasRole('super_admin', 'workshop_admin') && inv.status === 'unpaid' && <Button variant="ghost" size="sm" icon={<Ban size={15} />} onClick={() => setVoiding(true)}>Void</Button>}
      </>}>

      <article id="printable" className="card p-6 sm:p-10 max-w-3xl mx-auto w-full" aria-label={`Invoice ${inv.invoiceNo}`}>
        <header className="flex flex-wrap justify-between gap-6 pb-6 border-b border-border">
          <div><h2 className="text-xl font-bold tracking-tight">AutoCare <span className="bg-brand-lime px-1.5 rounded">Pro</span></h2><p className="text-caption text-text-muted mt-1">Vehicle Service &amp; Workshop</p></div>
          <div className="text-right"><p className="text-overline uppercase text-text-muted">Tax invoice</p><p className="font-mono font-bold text-lg">{inv.invoiceNo}</p><p className="text-caption text-text-muted">Issued <time dateTime={inv.issuedAt}>{formatDate(inv.issuedAt)}</time> · Due <time dateTime={inv.dueDate}>{formatDate(inv.dueDate)}</time></p></div>
        </header>
        <section className="grid sm:grid-cols-2 gap-6 py-6" aria-label="Billing details">
          <div><h3 className="text-overline uppercase text-text-muted">Billed to</h3><p className="font-semibold mt-1">{inv.customer?.name}</p><p className="text-body-sm text-text-secondary">{inv.customer?.phone}<br />{inv.customer?.email}<br />{inv.customer?.address}</p></div>
          <div><h3 className="text-overline uppercase text-text-muted">Vehicle</h3><p className="font-semibold mt-1">{inv.vehicle?.make} {inv.vehicle?.model} ({inv.vehicle?.year})</p><p className="text-body-sm text-text-secondary">Reg. {inv.vehicle?.registrationNumber}<br />Odometer {inv.job?.odometerIn?.toLocaleString('en-IN')} km</p></div>
        </section>
        <table className="w-full text-body-sm">
          <caption className="sr-only">Invoice line items</caption>
          <thead><tr className="border-y border-border text-left text-overline uppercase text-text-muted"><th scope="col" className="px-4 py-2.5">Description</th><th scope="col" className="px-4 py-2.5 text-right">Qty</th><th scope="col" className="px-4 py-2.5 text-right">Rate</th><th scope="col" className="px-4 py-2.5 text-right">Amount</th></tr></thead>
          <tbody><Group title="Labour" lines={labour} /><Group title="Spare parts" lines={parts} /></tbody>
        </table>
        <div className="flex justify-end mt-6"><TotalsSummary {...inv} /></div>
        <footer className="mt-8 pt-4 border-t border-border text-caption text-text-muted">Thank you for choosing AutoCare Pro. Payments are recorded manually by the workshop cashier.</footer>
      </article>

      <SectionCard title="Payments" className="no-print max-w-3xl mx-auto w-full">
        {inv.payments.length === 0 ? <p className="text-body-sm text-text-muted">No payments recorded yet.</p> : (
          <ul className="divide-y divide-border">{inv.payments.map((p) => (
            <li key={p._id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-body-sm">
              <div><p className="font-medium">{formatMoney(p.amount)} <span className="text-text-muted font-normal">· {humanize(p.method)}</span> {p.isTest && <Badge variant="warning" size="sm">TEST</Badge>}</p><p className="text-caption text-text-muted">{p.paymentNo} · {formatDateTime(p.paidAt)}{p.receivedBy?.name ? ` · ${p.receivedBy.name}` : ''}{p.reference ? ` · ref ${p.reference}` : ''}</p></div>
            </li>))}</ul>
        )}
      </SectionCard>

      {pay && <PaymentDialog invoice={inv} onClose={() => setPay(false)} onDone={() => { toast.success('Payment recorded'); res.reload(); }} />}
      <ConfirmDialog open={voiding} onClose={() => setVoiding(false)} danger title="Void invoice?" message="The job returns to 'completed' so a corrected invoice can be generated." confirmLabel="Void invoice"
        onConfirm={async () => { try { await post(`/invoices/${id}/void`, {}); toast.success('Invoice voided'); res.reload(); } catch (e) { toast.error('Cannot void', parseError(e).message); } setVoiding(false); }} />
    </Page>
  );
}
