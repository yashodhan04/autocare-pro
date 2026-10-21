import { useNavigate } from 'react-router-dom';
import { Page } from '../components/common/Page.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { FilterBar } from '../components/common/FilterBar.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { PAYMENT_METHOD_OPTIONS } from '../config/options.js';
import { useList } from '../hooks/useList.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDateTime, formatMoney, humanize } from '../utils/format.js';

export default function PaymentsPage() {
  const list = useList('/payments');
  const navigate = useNavigate();
  const { role } = useAuth();
  const columns = [
    { key: 'paymentNo', header: 'Payment', render: (p) => <div><p className="font-mono text-caption font-semibold">{p.paymentNo}</p><p className="text-caption text-text-muted">{formatDateTime(p.paidAt)}</p></div> },
    { key: 'invoice', header: 'Invoice', render: (p) => <span className="font-mono text-caption">{p.invoice?.invoiceNo}</span> },
    ...(role !== 'customer' ? [{ key: 'customer', header: 'Customer', hideBelow: 'md', render: (p) => p.customer?.name }] : []),
    { key: 'method', header: 'Method', hideBelow: 'sm', render: (p) => <span className="flex items-center gap-2">{humanize(p.method)}{p.isTest && <Badge variant="warning" size="sm">TEST</Badge>}</span> },
    { key: 'receivedBy', header: 'Received by', hideBelow: 'lg', render: (p) => p.receivedBy?.name ?? '—' },
    { key: 'amount', header: 'Amount', align: 'right', render: (p) => <span className="font-semibold">{formatMoney(p.amount)}</span> },
  ];
  return (
    <Page title="Payments" description="Manually recorded payments. Entries marked TEST are simulated transactions — no payment gateway is connected.">
      <FilterBar list={list} search={false} selects={[{ name: 'method', label: 'All methods', options: PAYMENT_METHOD_OPTIONS }]} />
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} pagination={list.pagination} onPageChange={list.setPage} onRowClick={(p) => navigate(`/app/invoices/${p.invoice?._id}`)} caption="Payments"
        emptyTitle="No payments recorded" emptyMessage="Record a payment from an invoice or job card." />
    </Page>
  );
}
