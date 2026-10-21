import { Link } from 'react-router-dom';
import { Wrench, ShieldCheck, ClipboardCheck, Package } from 'lucide-react';

const POINTS = [
  [ClipboardCheck, 'Book services, approve estimates and track every repair online'],
  [Package, 'Live parts inventory with stock-movement history'],
  [ShieldCheck, 'Role-based access for advisors, mechanics, cashiers and admins'],
];

/** Split-screen layout shared by login / register / reset pages. */
export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-surface-page">
      <aside className="hidden lg:flex flex-col justify-between bg-brand-charcoal text-white p-12 relative overflow-hidden" aria-label="About AutoCare Pro">
        <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-brand-lime/10 blur-3xl" aria-hidden="true" />
        <Link to="/" className="flex items-center gap-3 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime rounded-lg w-fit">
          <span className="w-10 h-10 rounded-xl bg-brand-lime flex items-center justify-center"><Wrench size={20} className="text-brand-charcoal" aria-hidden="true" /></span>
          <span className="text-lg font-bold tracking-tight">AutoCare <span className="text-brand-lime">Pro</span></span>
        </Link>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">Your workshop, <span className="text-brand-lime">running smoothly.</span></h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map(([Icon, text]) => (
              <li key={text} className="flex gap-3 text-brand-charcoal-text">
                <Icon size={18} className="text-brand-lime shrink-0 mt-0.5" aria-hidden="true" /><span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-caption text-brand-charcoal-text">© {new Date().getFullYear()} AutoCare Pro — Vehicle Service &amp; Workshop Management</p>
      </aside>

      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8 w-fit">
            <span className="w-9 h-9 rounded-xl bg-brand-lime flex items-center justify-center"><Wrench size={18} className="text-brand-charcoal" aria-hidden="true" /></span>
            <span className="font-bold tracking-tight text-text-primary">AutoCare <span className="text-text-secondary">Pro</span></span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">{title}</h1>
          {subtitle && <p className="text-body-sm text-text-muted mt-1.5">{subtitle}</p>}
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 text-body-sm text-text-muted text-center">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
