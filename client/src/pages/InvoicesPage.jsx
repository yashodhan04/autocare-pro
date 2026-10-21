import { useNavigate } from 'react-router-dom';
import { Page } from '../components/common/Page.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { FilterBar } from '../components/common/FilterBar.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { useList } from '../hooks/useList.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate, formatMoney } from '../utils/format.js';

const STATUS = [{ value: 'unpaid', label: 'Unpaid' }, { value: 'partial', label: 'Partially paid' }, { value: 'paid', label: 'Paid' }, { value: 'void', label: 'Void' }];

export default function InvoicesPage() {
  const list = useList('/invoices');
  const { role } = useAuth();
  const navigate = useNavigate();
  const isCustomer = role === 'customer';
  const columns = [
    { key: 'invoiceNo', header: 'Invoice', render: (i) => <div><p className="font-mono text-caption font-semibold">{i.invoiceNo}</p><p className="text-caption text-text-muted">{formatDate(i.issuedAt)}</p></div> },
    ...(!isCustomer ? [{ key: 'customer', header: 'Customer', hideBelow: 'md', render: (i) => i.customer?.name }] : []),
    { key: 'vehicle', header: 'Vehicle', hideBelow: 'sm', render: (i) => i.vehicle?.registrationNumber },
    { key: 'dueDate', header: 'Due', hideBelow: 'lg', render: (i) => formatDate(i.dueDate) },
    { key: 'total', header: 'Total', align: 'right', render: (i) => formatMoney(i.total) },
    { key: 'balance', header: 'Balance', align: 'right', render: (i) => <span className={i.balance > 0 && i.status !== 'void' ? 'font-semibold text-danger' : 'text-text-muted'}>{formatMoney(i.balance)}</span> },
    { key: 'status', header: 'Status', render: (i) => <StatusBadge status={i.status} /> },
  ];
  return (
    <Page title={isCustomer ? 'My invoices' : 'Invoices'} description="Labour and parts breakdown, tax, discounts and payment status. Invoices are generated from completed job cards.">
      <FilterBar list={list} placeholder="Search invoice number…" selects={[{ name: 'status', label: 'All statuses', options: STATUS }]} />
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} pagination={list.pagination} onPageChange={list.setPage} onRowClick={(i) => navigate(`/app/invoices/${i._id}`)} caption="Invoices"
        emptyTitle="No invoices" emptyMessage="Invoices appear once a job has passed its quality check." />
    </Page>
  );
}
