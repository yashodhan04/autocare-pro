import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn.js';

/**
 * Dropdown — Accessible dropdown menu.
 *
 * Props:
 *   trigger    ReactNode              — the element that toggles the menu
 *   items      Array<{
 *                label: string,
 *                icon?: ReactNode,
 *                onClick?: () => void,
 *                href?: string,
 *                danger?: boolean,
 *                disabled?: boolean,
 *                divider?: boolean  (renders a separator instead of an item)
 *              }>
 *   align      'left' | 'right'       default: 'left'
 *   width      string                 Tailwind width class, default 'w-48'
 *   className  string
 */
export function Dropdown({ trigger, items = [], align = 'left', width = 'w-48', className }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const firstItemRef  = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (!containerRef.current?.contains(e.target)) close();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, close]);

  // Focus first item when menu opens
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => firstItemRef.current?.focus());
    }
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      {/* Trigger */}
      <div onClick={() => setOpen((v) => !v)} aria-haspopup="true" aria-expanded={open}>
        {trigger}
      </div>

      {/* Menu */}
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-[100] mt-1.5 py-1.5 rounded-xl border border-border bg-surface-card',
            'shadow-lg animate-scale-in origin-top',
            width,
            align === 'right' ? 'right-0' : 'left-0',
          )}
          style={{ boxShadow: 'var(--shadow-md)' }}
        >
          {items.map((item, i) => {
            if (item.divider) {
              return <div key={i} className="my-1 border-t border-border" role="separator" />;
            }

            const Tag = item.href ? 'a' : 'button';
            const itemProps = item.href
              ? { href: item.href }
              : { type: 'button', onClick: () => { item.onClick?.(); close(); } };

            return (
              <Tag
                key={i}
                role="menuitem"
                ref={i === 0 ? firstItemRef : undefined}
                disabled={item.disabled}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3.5 py-2 text-body-sm',
                  'transition-colors duration-100 cursor-pointer',
                  'focus-visible:outline-none focus-visible:bg-surface-muted',
                  item.danger
                    ? 'text-danger hover:bg-danger-light'
                    : 'text-text-primary hover:bg-surface-muted',
                  item.disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
                )}
                {...itemProps}
              >
                {item.icon && (
                  <span className="shrink-0 text-text-muted" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                {item.label}
              </Tag>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * DropdownTrigger — Styled default trigger button for Dropdown.
 */
export function DropdownTrigger({ label, icon, className }) {
  return (
    <button
      type="button"
      className={cn(
        'btn-outline inline-flex items-center gap-2',
        className,
      )}
    >
      {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
      {label}
      <ChevronDown size={15} aria-hidden="true" className="text-text-muted" />
    </button>
  );
}
