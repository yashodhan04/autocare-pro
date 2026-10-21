import { Link } from 'react-router-dom';
import { Wrench, ArrowLeft, Home, Palette } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';

/**
 * NotFoundPage — Branded 404 error page.
 */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-brand-charcoal text-white flex flex-col items-center justify-center p-6 text-center">
      {/* Brand logo */}
      <div className="w-16 h-16 rounded-2xl bg-brand-lime flex items-center justify-center text-brand-charcoal mb-6 shadow-glow">
        <Wrench size={32} aria-hidden="true" />
      </div>

      <div className="space-y-2 max-w-md">
        <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-brand-lime px-2.5 py-1 rounded-full bg-brand-lime/10 border border-brand-lime/20 inline-block">
          Error 404
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Page Not Found
        </h1>
        <p className="text-body-sm text-brand-charcoal-text">
          The route you requested does not exist in AutoCare Pro. It may have been moved or is not yet configured.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link to="/app/dashboard">
          <Button variant="primary" size="md">
            <Home size={16} aria-hidden="true" />
            <span>Go to Dashboard</span>
          </Button>
        </Link>
        <Link to="/design-system">
          <Button variant="outline" size="md" className="border-brand-charcoal-soft text-white hover:bg-brand-charcoal-soft">
            <Palette size={16} aria-hidden="true" />
            <span>Design System</span>
          </Button>
        </Link>
      </div>

      <p className="mt-12 text-[11px] text-brand-charcoal-text font-mono">
        AutoCare Pro — Vehicle Service &amp; Workshop Management System
      </p>
    </div>
  );
}
