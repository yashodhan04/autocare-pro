import { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn.js';

/**
 * Tooltip — Lightweight accessible tooltip.
 *
 * Props:
 *   content   string | ReactNode   — tooltip text/content
 *   side      'top' | 'bottom' | 'left' | 'right'   default: 'top'
 *   delay     number (ms)          default: 300
 *   className string               — applied to the tooltip bubble
 *   children  ReactNode            — the element that triggers the tooltip
 */

const sideStyles = {
  top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left:   'right-full top-1/2 -translate-y-1/2 mr-2',
  right:  'left-full top-1/2 -translate-y-1/2 ml-2',
};

export function Tooltip({ content, side = 'top', delay = 300, className, children }) {
  const [visible, setVisible] = useState(false);
  const timer = useRef(null);
  const id = useRef(`tooltip-${Math.random().toString(36).slice(2)}`);

  const show = () => {
    timer.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    clearTimeout(timer.current);
    setVisible(false);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <span aria-describedby={visible ? id.current : undefined}>
        {children}
      </span>

      {visible && (
        <span
          role="tooltip"
          id={id.current}
          className={cn(
            'absolute z-[500] pointer-events-none',
            'px-2.5 py-1.5 rounded-lg',
            'text-xs font-medium text-white bg-brand-charcoal',
            'shadow-lg whitespace-nowrap animate-fade-in',
            sideStyles[side] || sideStyles.top,
            className,
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
