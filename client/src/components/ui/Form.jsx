import { forwardRef } from 'react';
import { Eye, EyeOff, Search, X } from 'lucide-react';
import { useState, useRef } from 'react';
import { cn } from '../../utils/cn.js';

/* ── FormField wrapper ────────────────────────────────────── */
/**
 * FormField — Label + input slot + helper text + error message.
 *
 * Props:
 *   label     string
 *   htmlFor   string — matches the input's id
 *   required  boolean
 *   helper    string
 *   error     string
 *   children  ReactNode (the input)
 */
export function FormField({ label, htmlFor, required, helper, error, children, className }) {
  return (
    <div className={cn('flex flex-col', className)}>
      {label && (
        <label htmlFor={htmlFor} className="form-label">
          {label}
          {required && (
            <span className="text-danger ml-0.5" aria-hidden="true"> *</span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p className="form-error" role="alert" id={htmlFor ? `${htmlFor}-error` : undefined}>
          <span aria-hidden="true">⚠</span> {error}
        </p>
      ) : helper ? (
        <p className="form-helper">{helper}</p>
      ) : null}
    </div>
  );
}

/* ── Base Input ───────────────────────────────────────────── */
/**
 * Input — Generic text / email / number input.
 *
 * Props:
 *   type      string     default: 'text'
 *   error     boolean
 *   leftIcon  ReactNode  — icon inside left edge
 *   rightIcon ReactNode  — icon inside right edge
 *   ...rest   any valid <input> props
 */
export const Input = forwardRef(function Input(
  { type = 'text', error, leftIcon, rightIcon, className, id, ...rest },
  ref,
) {
  const hasLeft  = Boolean(leftIcon);
  const hasRight = Boolean(rightIcon);

  return (
    <div className="relative w-full">
      {hasLeft && (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-muted" aria-hidden="true">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        id={id}
        type={type}
        className={cn(
          'form-input',
          error && 'form-input-error',
          hasLeft  && 'pl-9',
          hasRight && 'pr-9',
          className,
        )}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error && id ? `${id}-error` : undefined}
        {...rest}
      />
      {hasRight && (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-text-muted" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </div>
  );
});

/* ── Password Input ───────────────────────────────────────── */
export const PasswordInput = forwardRef(function PasswordInput(
  { error, className, id, ...rest },
  ref,
) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative w-full">
      <input
        ref={ref}
        id={id}
        type={show ? 'text' : 'password'}
        className={cn('form-input pr-10', error && 'form-input-error', className)}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error && id ? `${id}-error` : undefined}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-3 flex items-center text-text-muted hover:text-text-secondary transition-colors"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show
          ? <EyeOff size={16} aria-hidden="true" />
          : <Eye    size={16} aria-hidden="true" />}
      </button>
    </div>
  );
});

/* ── Search Input ─────────────────────────────────────────── */
export function SearchInput({ value, onChange, onClear, placeholder = 'Search…', className, id }) {
  const inputRef = useRef(null);
  return (
    <div className={cn('relative w-full', className)}>
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-muted" aria-hidden="true">
        <Search size={16} />
      </span>
      <input
        ref={inputRef}
        id={id}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="form-input pl-9 pr-9"
      />
      {value && (
        <button
          type="button"
          onClick={() => { onClear?.(); inputRef.current?.focus(); }}
          className="absolute inset-y-0 right-3 flex items-center text-text-muted hover:text-text-primary transition-colors"
          aria-label="Clear search"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/* ── Textarea ─────────────────────────────────────────────── */
export const Textarea = forwardRef(function Textarea(
  { error, className, id, rows = 4, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      id={id}
      rows={rows}
      className={cn(
        'form-input resize-y min-h-[80px] leading-relaxed',
        error && 'form-input-error',
        className,
      )}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={error && id ? `${id}-error` : undefined}
      {...rest}
    />
  );
});

/* ── Select ───────────────────────────────────────────────── */
export const Select = forwardRef(function Select(
  { error, className, id, children, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      id={id}
      className={cn(
        'form-input cursor-pointer appearance-none',
        'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' fill=\'none\' viewBox=\'0 0 24 24\'%3E%3Cpath stroke=\'%238B93A5\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")]',
        'bg-no-repeat bg-[right_0.75rem_center] pr-9',
        error && 'form-input-error',
        className,
      )}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={error && id ? `${id}-error` : undefined}
      {...rest}
    >
      {children}
    </select>
  );
});

/* ── Checkbox ─────────────────────────────────────────────── */
export const Checkbox = forwardRef(function Checkbox(
  { label, id, className, ...rest },
  ref,
) {
  return (
    <label htmlFor={id} className={cn('inline-flex items-center gap-2.5 cursor-pointer select-none group', className)}>
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className={cn(
          'h-4 w-4 rounded border border-border cursor-pointer',
          'text-brand-lime bg-surface-card',
          'checked:bg-brand-lime checked:border-brand-lime',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime focus-visible:ring-offset-1',
          'transition-colors duration-150',
        )}
        {...rest}
      />
      {label && (
        <span className="text-body-sm text-text-primary group-hover:text-text-primary">
          {label}
        </span>
      )}
    </label>
  );
});

/* ── Switch (Toggle) ──────────────────────────────────────── */
export function Switch({ checked, onChange, label, id, disabled }) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'inline-flex items-center gap-3 cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-pill',
          'transition-colors duration-200 focus:outline-none',
          'focus-visible:ring-2 focus-visible:ring-brand-lime focus-visible:ring-offset-1',
          checked ? 'bg-brand-lime' : 'bg-border-strong',
        )}
      >
        <span
          className={cn(
            'block h-4 w-4 rounded-full bg-white shadow-sm',
            'transition-transform duration-200',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </button>
      {label && (
        <span className="text-body-sm text-text-primary">{label}</span>
      )}
    </label>
  );
}
