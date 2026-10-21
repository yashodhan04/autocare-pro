import { useState } from 'react';
import { FormField, Input, Select, Textarea, Checkbox } from '../ui/Form.jsx';
import { Button } from '../ui/Button.jsx';
import { parseError } from '../../services/api.js';
import { cn } from '../../utils/cn.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(f, value, values) {
  const empty = value === '' || value == null || (Array.isArray(value) && !value.length);
  if (f.required && empty) return `${f.label} is required`;
  if (empty) return null;
  if (f.type === 'email' && !EMAIL.test(String(value).trim())) return 'Enter a valid email address';
  if (f.type === 'number') {
    const n = Number(value);
    if (Number.isNaN(n)) return `${f.label} must be a number`;
    if (f.min != null && n < f.min) return `${f.label} must be at least ${f.min}`;
    if (f.max != null && n > f.max) return `${f.label} must be at most ${f.max}`;
  }
  if (f.pattern && !f.pattern.test(String(value))) return f.patternMessage ?? `Enter a valid ${f.label.toLowerCase()}`;
  return f.validate?.(value, values) ?? null;
}

function coerce(fields, values) {
  const out = {};
  for (const f of fields) {
    const v = values[f.name];
    if (v === '' || v == null) { if (f.type === 'checkbox') out[f.name] = false; continue; }
    out[f.name] = f.type === 'number' ? Number(v) : typeof v === 'string' ? v.trim() : v;
  }
  return out;
}

/**
 * FieldsForm — config-driven controlled form with client validation and server-error display.
 * field: { name, label, type, required, options, placeholder, helper, min, max, step, rows, span, pattern, validate, hidden(values), disabled }
 * onSubmit(values) may throw an axios error; its message / per-field details are shown.
 */
export function FieldsForm({ id, fields, initial = {}, onSubmit, onCancel, submitLabel = 'Save', hideActions = false, onSuccess, onFieldChange }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.name, initial[f.name] ?? (f.type === 'checkbox' ? false : f.type === 'multicheck' ? [] : '')])));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (name, v) => { setValues((s) => ({ ...s, [name]: v })); setErrors((e) => ({ ...e, [name]: undefined })); onFieldChange?.(name, v); };
  const visible = fields.filter((f) => !f.hidden?.(values));

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    visible.forEach((f) => { const m = validateField(f, values[f.name], values); if (m) errs[f.name] = m; });
    setErrors(errs);
    setFormError(null);
    if (Object.keys(errs).length) {
      document.getElementById(`${id ?? 'f'}-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    setSaving(true);
    try {
      const result = await onSubmit(coerce(visible, values));
      onSuccess?.(result);
    } catch (err) {
      const { message, fields: fe } = parseError(err);
      setErrors(fe);
      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form id={id} onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && <div role="alert" className="rounded-lg border border-danger/30 bg-danger-light text-danger-text text-body-sm px-3 py-2.5">{formError}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {visible.map((f) => {
          const fid = `${id ?? 'f'}-${f.name}`;
          const common = { id: fid, error: Boolean(errors[f.name]), disabled: f.disabled, placeholder: f.placeholder };
          let control;
          if (f.type === 'select') {
            control = (
              <Select {...common} value={values[f.name]} onChange={(e) => set(f.name, e.target.value)}>
                <option value="">{f.placeholder ?? 'Select…'}</option>
                {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            );
          } else if (f.type === 'textarea') {
            control = <Textarea {...common} rows={f.rows ?? 3} value={values[f.name]} onChange={(e) => set(f.name, e.target.value)} />;
          } else if (f.type === 'checkbox') {
            control = <Checkbox id={fid} label={f.checkLabel ?? f.label} checked={Boolean(values[f.name])} onChange={(e) => set(f.name, e.target.checked)} />;
          } else if (f.type === 'multicheck') {
            control = (
              <div id={fid} className="flex flex-wrap gap-x-4 gap-y-2" role="group" aria-label={f.label}>
                {f.options.map((o) => (
                  <Checkbox key={o.value} id={`${fid}-${o.value}`} label={o.label} checked={values[f.name].includes(o.value)}
                    onChange={(e) => set(f.name, e.target.checked ? [...values[f.name], o.value] : values[f.name].filter((x) => x !== o.value))} />
                ))}
              </div>
            );
          } else {
            control = <Input {...common} type={f.type ?? 'text'} min={f.min} max={f.max} step={f.step} inputMode={f.inputMode} autoComplete={f.autoComplete} value={values[f.name]} onChange={(e) => set(f.name, e.target.value)} />;
          }
          return (
            <FormField key={f.name} label={f.type === 'checkbox' ? undefined : f.label} htmlFor={fid} required={f.required} helper={f.helper} error={errors[f.name]} className={cn((f.span === 2 || f.type === 'textarea' || f.type === 'multicheck') && 'sm:col-span-2')}>
              {control}
            </FormField>
          );
        })}
      </div>
      {!hideActions && (
        <div className="flex justify-end gap-3 pt-2">
          {onCancel && <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>}
          <Button type="submit" loading={saving}>{submitLabel}</Button>
        </div>
      )}
    </form>
  );
}
