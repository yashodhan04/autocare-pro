import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn.js';

/**
 * Button — AutoCare Pro unified button component.
 *
 * Props:
 *   variant   'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'   default: 'primary'
 *   size      'sm' | 'md' | 'lg'                                          default: 'md'
 *   loading   boolean                                                      default: false
 *   icon      ReactNode — icon shown before label (or alone for icon buttons)
 *   iconOnly  boolean — renders a square icon-only button                  default: false
 *   className string
 *   ...rest   any valid <button> props (type, disabled, onClick, …)
 */
const variantMap = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  outline:   'btn-outline',
  ghost:     'btn-ghost',
  danger:    'btn-danger',
};

const sizeMap = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconOnly = false,
  className,
  disabled,
  ...rest
}) {
  const isDisabled = disabled || loading;

  const classes = cn(
    iconOnly ? 'btn btn-icon' : variantMap[variant],
    !iconOnly && sizeMap[size],
    iconOnly && size === 'sm' && 'btn-icon-sm',
    className,
  );

  return (
    <button
      className={classes}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      {...rest}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} className="animate-spin" aria-hidden="true" />
      ) : icon ? (
        <span className="shrink-0" aria-hidden="true">{icon}</span>
      ) : null}
      {!iconOnly && children && (
        <span>{children}</span>
      )}
      {iconOnly && !loading && icon && (
        <span className="shrink-0" aria-hidden="true">{icon}</span>
      )}
    </button>
  );
}
