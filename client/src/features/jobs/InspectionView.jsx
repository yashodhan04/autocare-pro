import { Dialog } from '../../components/ui/Dialog.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { formatDateTime } from '../../utils/format.js';

export function InspectionSummary({ inspection: i }) {
  return (
    <div className="space-y-4">
      <p className="text-caption text-text-muted">Inspected by <strong className="text-text-primary">{i.inspector?.name}</strong> on <time dateTime={i.inspectedAt}>{formatDateTime(i.inspectedAt)}</time></p>
      <ul className="divide-y divide-border rounded-xl border border-border">
        {i.items.map((it) => (
          <li key={it.component} className="flex items-start justify-between gap-3 px-4 py-2.5">
            <div><p className="text-body-sm font-medium">{it.component}</p>{it.comment && <p className="text-caption text-text-secondary">{it.comment}</p>}</div>
            <StatusBadge status={it.status} label={it.status === 'attention' ? 'Needs attention' : undefined} />
          </li>
        ))}
      </ul>
      {i.recommendedRepairs.length > 0 && (
        <div><h3 className="text-body-sm font-semibold mb-2">Recommended repairs</h3>
          <ul className="space-y-1.5">{i.recommendedRepairs.map((r, k) => <li key={k} className="flex items-center gap-2 text-body-sm"><Badge size="sm" variant={r.severity === 'high' ? 'danger' : r.severity === 'medium' ? 'warning' : 'neutral'}>{r.severity}</Badge>{r.description}</li>)}</ul></div>
      )}
      {i.comments && <p className="text-body-sm text-text-secondary border-l-2 border-brand-lime pl-3">{i.comments}</p>}
    </div>
  );
}

export function InspectionView({ inspection, onClose }) {
  return (
    <Dialog open={Boolean(inspection)} onClose={onClose} size="lg" title={inspection ? `Inspection — ${inspection.vehicle?.registrationNumber ?? ''}` : ''} description={inspection?.job?.jobNo}>
      {inspection && <InspectionSummary inspection={inspection} />}
    </Dialog>
  );
}
