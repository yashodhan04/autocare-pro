import { useState } from 'react';
import { Page } from '../components/common/Page.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { FilterBar } from '../components/common/FilterBar.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Input } from '../components/ui/Form.jsx';
import { Dialog } from '../components/ui/Dialog.jsx';
import { DetailList } from '../components/common/Page.jsx';
import { useList } from '../hooks/useList.js';
import { ROLE_LABELS, formatDateTime } from '../utils/format.js';

const ENTITIES = ['User', 'Customer', 'Vehicle', 'ServiceCatalog', 'Appointment', 'ServiceJob', 'Inspection', 'Estimate', 'InventoryItem', 'PurchaseOrder', 'Supplier', 'Invoice', 'Payment', 'Review', 'MaintenancePlan'].map((v) => ({ value: v, label: v }));
const PREFIXES = [['auth', 'Authentication'], ['user', 'Users & roles'], ['customer', 'Customers'], ['vehicle', 'Vehicles'], ['appointment', 'Appointments'], ['job', 'Jobs'], ['estimate', 'Estimates'], ['inventory', 'Inventory'], ['po', 'Purchase orders'], ['invoice', 'Invoices'], ['payment', 'Payments'], ['parts', 'Parts requests']].map(([value, label]) => ({ value, label }));

export default function AuditLogPage() {
  const list = useList('/audit-logs', { action: '', entityType: '', from: '', to: '' }, 20);
  const [openRow, setOpenRow] = useState(null);
  const columns = [
    { key: 'createdAt', header: 'When', render: (l) => <span className="whitespace-nowrap"><time dateTime={l.createdAt}>{formatDateTime(l.createdAt)}</time></span> },
    { key: 'actor', header: 'Actor', render: (l) => <div><p className="font-medium">{l.actorName ?? 'system'}</p><p className="text-caption text-text-muted">{ROLE_LABELS[l.actorRole] ?? ''}</p></div> },
    { key: 'action', header: 'Action', render: (l) => <Badge size="sm" variant="neutral"><span className="font-mono">{l.action}</span></Badge> },
    { key: 'summary', header: 'Details', hideBelow: 'md', render: (l) => <span className="line-clamp-2">{l.summary}</span> },
    { key: 'entityType', header: 'Entity', hideBelow: 'lg' },
  ];
  return (
    <Page title="Audit log" description="Who did what and when: authentication, record changes, estimate approvals, stock adjustments, invoices and role changes.">
      <FilterBar list={list} search={false} selects={[{ name: 'action', label: 'All actions', options: PREFIXES }, { name: 'entityType', label: 'All entities', options: ENTITIES }]}>
        <label className="sr-only" htmlFor="al-from">From date</label><Input id="al-from" type="date" value={list.filters.from} onChange={(e) => list.setFilter('from', e.target.value)} className="w-auto" />
        <label className="sr-only" htmlFor="al-to">To date</label><Input id="al-to" type="date" value={list.filters.to} onChange={(e) => list.setFilter('to', e.target.value)} className="w-auto" />
      </FilterBar>
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} pagination={list.pagination} onPageChange={list.setPage} caption="Audit log"
        onRowClick={setOpenRow} emptyTitle="No audit entries" emptyMessage="Nothing matches these filters." />
      <Dialog open={Boolean(openRow)} onClose={() => setOpenRow(null)} title="Audit entry" description={openRow?.action}>
        {openRow && <div className="space-y-4"><DetailList items={[['When', formatDateTime(openRow.createdAt)], ['Actor', `${openRow.actorName ?? 'system'} (${ROLE_LABELS[openRow.actorRole] ?? '—'})`], ['Entity', openRow.entityType], ['Entity id', <span className="font-mono text-caption">{openRow.entityId ?? '—'}</span>], ['IP address', openRow.ip], ['Summary', openRow.summary]]} />{openRow.meta && <pre className="text-caption bg-surface-muted rounded-lg p-3 overflow-x-auto">{JSON.stringify(openRow.meta, null, 2)}</pre>}</div>}
      </Dialog>
    </Page>
  );
}
