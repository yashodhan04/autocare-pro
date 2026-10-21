import { Dialog } from '../ui/Dialog.jsx';
import { FieldsForm } from './FieldsForm.jsx';

/** Modal wrapper around FieldsForm. Remount-safe: the form resets whenever `initial` / open changes. */
export function FormDialog({ open, onClose, title, description, fields, initial, onSubmit, submitLabel, size = 'md', onFieldChange }) {
  if (!open) return null;
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description} size={size}>
      <FieldsForm id="dialog-form" fields={fields} initial={initial} onSubmit={onSubmit} onSuccess={onClose} onCancel={onClose} submitLabel={submitLabel} onFieldChange={onFieldChange} />
    </Dialog>
  );
}
