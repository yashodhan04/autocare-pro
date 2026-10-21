import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { Page, DetailList } from '../components/common/Page.jsx';
import { LinkButton } from '../components/common/LinkButton.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { SectionCard } from '../components/ui/Card.jsx';
import { ErrorState } from '../components/ui/States.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { formatDate, formatMoney } from '../utils/format.js';

export default function SupplierDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const res = useFetch(`/suppliers/${id}`);
  if (res.loading && !res.data) return <Page><Skeleton className="h-8 w-60" /><Skeleton className="h-48 w-full" /></Page>;
  if (res.error) return <Page><ErrorState title="Supplier not found" message={res.error} /></Page>;
  const s = res.data;
  return (
    <Page title={s.name} badge={<StatusBadge status={s.isActive ? 'active' : 'inactive'} />} description="Supplier profile, supplied parts and transaction history."
      actions={<><LinkButton to="/app/suppliers" variant="outline" size="sm" icon={<ArrowLeft size={15} />}>Suppliers</LinkButton><LinkButton to={`/app/purchase-orders?supplier=${id}`} size="sm" icon={<ShoppingCart size={15} />}>Purchase orders</LinkButton></>}>
      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Contact"><DetailList columns={1} items={[['Contact person', s.contactPerson], ['Phone', s.phone], ['Email', s.email], ['Address', s.address], ['Total spend (placed orders)', formatMoney(s.totalSpend)]]} /></SectionCard>
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Supplied parts" noPadding><DataTable columns={[{ key: 'name', header: 'Part' }, { key: 'sku', header: 'SKU', className: 'font-mono text-caption' }, { key: 'quantity', header: 'In stock', align: 'right' }, { key: 'purchasePrice', header: 'Cost', align: 'right', render: (p) => formatMoney(p.purchasePrice) }]} rows={s.parts} emptyTitle="No parts linked" emptyMessage="Link parts to this supplier from the inventory page." /></SectionCard>
          <SectionCard title="Purchase orders" noPadding><DataTable columns={[{ key: 'poNo', header: 'PO', className: 'font-mono text-caption' }, { key: 'createdAt', header: 'Date', render: (o) => formatDate(o.createdAt) }, { key: 'total', header: 'Total', align: 'right', render: (o) => formatMoney(o.total) }, { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status} /> }]} rows={s.orders} onRowClick={(o) => navigate(`/app/purchase-orders/${o._id}`)} emptyTitle="No purchase orders" /></SectionCard>
        </div>
      </div>
    </Page>
  );
}
