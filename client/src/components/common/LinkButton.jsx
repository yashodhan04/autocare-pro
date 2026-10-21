import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn.js';

const V = { primary: 'btn btn-primary', secondary: 'btn btn-secondary', outline: 'btn btn-outline', ghost: 'btn btn-ghost' };
const S = { sm: 'btn-sm', md: 'btn-md', lg: 'btn-lg' };

/** A react-router <Link> styled as a Button (avoids invalid <a><button/></a> nesting). */
export function LinkButton({ to, variant = 'primary', size = 'md', icon, className, children, ...rest }) {
  return (
    <Link to={to} className={cn(V[variant], S[size], className)} {...rest}>
      {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </Link>
  );
}
