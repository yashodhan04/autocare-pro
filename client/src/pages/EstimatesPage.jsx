import { useNavigate } from 'react-router-dom';
import { Page } from '../components/common/Page.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { FilterBar } from '../components/common/FilterBar.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { useList } from '../hooks/useList.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate, formatMoney } from '../utils/format.js';

const STATUS = ['draft', 'pending_approval', 'approved', 'rejected', 'superseded'].map((v) => ({ value: v, label: v.replace('_', ' ').replace(/^./, (c) => c.toUpperCase()) }));

export default function EstimatesPage() {
  const list = useList('/estimates');
  const { role } = useAuth();
  const navigate = useNavigate();
  const isCustomer = role === 'customer';

  const columns = [
    { key: 'estimateNo', header: 'Estimate', render: (e) => <div><p className="font-mono text-caption font-semibold">{e.estimateNo}</p><p className="text-caption text-text-muted">Rev {e.revision} · {formatDate(e.createdAt)}</p></div> },
    { key: 'job', header: 'Job', hideBelow: 'sm', render: (e) => <span className="font-mono text-caption">{e.job?.jobNo}</span> },
    { key: 'vehicle', header: 'Vehicle', render: (e) => e.vehicle?.registrationNumber },
    ...(!isCustomer ? [{ key: 'customer', header: 'Customer', hideBelow: 'md', render: (e) => e.customer?.name }] : []),
    { key: 'total', header: 'Total', align: 'right', render: (e) => <span className="font-semibold">{formatMoney(e.total)}</span> },
    { key: 'status', header: 'Status', render: (e) => <StatusBadge status={e.status} /> },
  ];

  return (
    <Page title={isCustomer ? 'My estimates' : 'Estimates'} description={isCustomer ? 'Review repair estimates and approve or reject them.' : 'Repair estimates with revisions and customer approval history. Prepare new ones from a job card.'}>
      <FilterBar list={list} search={false} selects={[{ name: 'status', label: 'All statuses', options: isCustomer ? STATUS.filter((s) => s.value !== 'draft') : STATUS }]} />
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} pagination={list.pagination} onPageChange={list.setPage} onRowClick={(e) => navigate(`/app/estimates/${e._id}`)} caption="Estimates"
        emptyTitle="No estimates" emptyMessage={isCustomer ? 'Estimates for your repairs will appear here for your approval.' : 'Estimates are prepared from the job card once an inspection is recorded.'} />
    </Page>
  );
}
