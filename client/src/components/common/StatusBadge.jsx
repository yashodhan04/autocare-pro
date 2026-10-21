import { Badge } from '../ui/Badge.jsx';
import { humanize, statusVariant } from '../../utils/format.js';

export function StatusBadge({ status, label, size = 'sm' }) {
  if (!status) return null;
  return <Badge variant={statusVariant(status)} size={size} dot pill>{label ?? humanize(status)}</Badge>;
}
