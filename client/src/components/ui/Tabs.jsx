import { useState } from 'react';
import { cn } from '../../utils/cn.js';

/**
 * Tabs — Horizontal tab navigation.
 *
 * Props:
 *   tabs       Array<{ id: string, label: string, icon?: ReactNode, disabled?: boolean }>
 *   active     string               — currently active tab id
 *   onChange   (id: string) => void
 *   variant    'underline' | 'pill'   default: 'underline'
 *   size       'sm' | 'md'            default: 'md'
 *   className  string
 *   children   ReactNode             — optional panel area below tabs
 */
export function Tabs({ tabs = [], active, onChange, variant = 'underline', size = 'md', className, children }) {
  return (
    <div className={cn('flex flex-col', className)}>
      {/* Tab strip */}
      <div
        role="tablist"
        className={cn(
          'flex items-center gap-0.5',
          variant === 'underline' && 'border-b border-border',
          variant === 'pill' && 'bg-surface-muted p-1 rounded-xl w-fit',
        )}
      >
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onChange?.(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 font-medium transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime focus-visible:ring-offset-1',
                'disabled:opacity-40 disabled:cursor-not-allowed',

                // Underline variant
                variant === 'underline' && [
                  'px-4 pb-3 pt-0.5 text-body-sm border-b-2 -mb-px rounded-t-sm',
                  isActive
                    ? 'border-brand-lime text-text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong',
                ],

                // Pill variant
                variant === 'pill' && [
                  size === 'sm' ? 'px-3 py-1.5 text-xs rounded-lg' : 'px-4 py-2 text-body-sm rounded-lg',
                  isActive
                    ? 'bg-surface-card text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary',
                ],
              )}
            >
              {tab.icon && <span className="shrink-0" aria-hidden="true">{tab.icon}</span>}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      {children && (
        <div className="flex-1">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * TabPanel — Content panel associated with a tab.
 *
 * Props:
 *   id      string — must match the corresponding tab.id
 *   active  string — currently active tab id
 */
export function TabPanel({ id, active, children, className }) {
  if (active !== id) return null;

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${id}`}
      aria-labelledby={`tab-${id}`}
      className={cn('animate-fade-in', className)}
    >
      {children}
    </div>
  );
}
