import { useState } from 'react';

import { Page } from '../components/common/Page.jsx';
import { DataTable } from '../components/common/DataTable.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { InspectionView } from '../features/jobs/InspectionView.jsx';
import { useList } from '../hooks/useList.js';
import { formatDateTime } from '../utils/format.js';
import { LinkButton } from '../components/common/LinkButton.jsx';

export default function InspectionsPage() {
  const list = useList('/inspections');
  const [open, setOpen] = useState(null);

  const columns = [
    { key: 'job', header: 'Job', render: (i) => <span className="font-mono text-caption font-semibold">{i.job?.jobNo}</span> },
    { key: 'vehicle', header: 'Vehicle', render: (i) => `${i.vehicle?.registrationNumber ?? ''} ${i.vehicle?.make ?? ''} ${i.vehicle?.model ?? ''}` },
    { key: 'inspector', header: 'Inspector', hideBelow: 'md', render: (i) => i.inspector?.name },
    { key: 'inspectedAt', header: 'Date', hideBelow: 'sm', render: (i) => formatDateTime(i.inspectedAt) },
    { key: 'result', header: 'Findings', render: (i) => {
      const fail = i.items.filter((x) => x.status === 'fail').length, att = i.items.filter((x) => x.status === 'attention').length;
      return <div className="flex gap-1.5 flex-wrap">{fail > 0 && <Badge variant="danger" size="sm">{fail} fail</Badge>}{att > 0 && <Badge variant="warning" size="sm">{att} attention</Badge>}{!fail && !att && <Badge variant="success" size="sm">All pass</Badge>}</div>;
    } },
    { key: 'open', header: <span className="sr-only">Job</span>, align: 'right', render: (i) => <span onClick={(e) => e.stopPropagation()}><LinkButton to={`/app/service-jobs/${i.job?._id}`} variant="ghost" size="sm">Open job</LinkButton></span> },
  ];

  return (
    <Page title="Inspections" description="Digital inspection records linked to job cards. Record new inspections from a job card.">
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} pagination={list.pagination} onPageChange={list.setPage} onRowClick={setOpen} caption="Inspections"
        emptyTitle="No inspections recorded" emptyMessage="Inspections are recorded from the Inspection tab of a service job." />
      <InspectionView inspection={open} onClose={() => setOpen(null)} />
    </Page>
  );
}
