import { Link } from 'react-router-dom';
import { Wrench, CalendarCheck, ClipboardCheck, PackageCheck, Receipt, BellRing, ArrowRight, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const FEATURES = [
  [CalendarCheck, 'Online booking', 'Pick a service and a free slot. The workshop confirms; you get notified.'],
  [ClipboardCheck, 'Digital inspections', 'Every component rated, with technician comments and recommended repairs.'],
  [Receipt, 'Transparent estimates', 'Labour, parts, tax and discounts itemised. Approve or reject before work starts.'],
  [PackageCheck, 'Live parts inventory', 'Stock movements, reorder alerts and purchase orders keep the bays supplied.'],
  [BellRing, 'Service reminders', 'Reminders by date or odometer so nothing is missed between visits.'],
  [Star, 'Honest feedback', 'Rate every completed service; admins moderate before anything is published.'],
];
const STEPS = ['Register your vehicle', 'Book a service slot', 'Vehicle check-in and inspection', 'Review and approve the estimate', 'Repair, quality check and invoice', 'Pick up your vehicle and keep the history'];

/** Public marketing page — semantic HTML (header / nav / main / section / article / footer), lists, images with alt text. */
export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="bg-surface-page text-text-primary min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-brand-lime focus:px-4 focus:py-2 focus:rounded-lg">Skip to content</a>
      <header className="bg-brand-charcoal text-white">
        <nav aria-label="Primary" className="max-w-6xl mx-auto flex items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight">
            <img src="/favicon.svg" alt="" width="32" height="32" className="rounded-lg" /> AutoCare <span className="text-brand-lime">Pro</span>
          </Link>
          <ul className="flex items-center gap-2 text-body-sm">
            <li className="hidden sm:block"><a href="#features" className="px-3 py-2 text-brand-charcoal-text hover:text-white">Features</a></li>
            <li className="hidden sm:block"><a href="#how" className="px-3 py-2 text-brand-charcoal-text hover:text-white">How it works</a></li>
            {isAuthenticated ? <li><Link to="/app/dashboard" className="btn btn-primary btn-sm">Open app</Link></li> : <>
              <li><Link to="/login" className="px-3 py-2 text-white hover:text-brand-lime">Sign in</Link></li>
              <li><Link to="/register" className="btn btn-primary btn-sm">Get started</Link></li></>}
          </ul>
        </nav>

        <div className="max-w-6xl mx-auto px-5 pt-14 pb-20 grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
          <div>
            <p className="text-overline uppercase tracking-widest text-brand-lime">Vehicle service &amp; workshop management</p>
            <h1 className="mt-4 text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05]">Know exactly what your car needs — <span className="text-brand-lime">before the bill.</span></h1>
            <p className="mt-5 text-lg text-brand-charcoal-text max-w-xl">One platform for customers, advisors, mechanics, stock-keepers and cashiers: from booking to inspection, estimate, repair, invoice and service history.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn btn-primary btn-lg">Create a free account <ArrowRight size={18} aria-hidden="true" /></Link>
              <Link to="/login" className="btn btn-lg border border-brand-charcoal-soft text-white hover:bg-brand-charcoal-mid">Workshop sign in</Link>
            </div>
          </div>
          <figure className="hidden lg:block" aria-label="Illustration of a service bay gauge">
            <svg viewBox="0 0 320 260" role="img" aria-labelledby="gauge-t" className="w-full">
              <title id="gauge-t">Dashboard gauge showing a healthy vehicle with a lime indicator</title>
              <circle cx="160" cy="130" r="108" fill="#22262F" stroke="#2C3140" strokeWidth="2" />
              <path d="M70 190 A 108 108 0 1 1 250 190" fill="none" stroke="#2C3140" strokeWidth="14" strokeLinecap="round" />
              <path d="M70 190 A 108 108 0 0 1 232 60" fill="none" stroke="#C8F135" strokeWidth="14" strokeLinecap="round" />
              <line x1="160" y1="130" x2="214" y2="86" stroke="#fff" strokeWidth="5" strokeLinecap="round" /><circle cx="160" cy="130" r="9" fill="#C8F135" />
              <text x="160" y="196" textAnchor="middle" fill="#9BA3AF" fontSize="12" letterSpacing="2">VEHICLE HEALTH</text>
              <text x="160" y="222" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="700">92%</text>
            </svg>
            <figcaption className="sr-only">Decorative gauge</figcaption>
          </figure>
        </div>
      </header>

      <main id="main">
        <section id="features" aria-labelledby="features-h" className="max-w-6xl mx-auto px-5 py-20">
          <h2 id="features-h" className="text-3xl font-bold tracking-tight">Everything a workshop runs on</h2>
          <p className="text-text-secondary mt-2 max-w-2xl">Built around the real repair workflow, not a generic admin template.</p>
          <ul className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(([Icon, title, text], i) => (
              <li key={title}>
                <article className={`h-full rounded-2xl border border-border bg-surface-card p-6 ${i % 2 ? 'lg:translate-y-4' : ''}`}>
                  <span className="w-10 h-10 rounded-xl bg-brand-lime flex items-center justify-center"><Icon size={20} aria-hidden="true" /></span>
                  <h3 className="mt-4 font-semibold text-lg">{title}</h3>
                  <p className="text-body-sm text-text-secondary mt-1.5">{text}</p>
                </article>
              </li>))}
          </ul>
        </section>

        <section id="how" aria-labelledby="how-h" className="bg-brand-charcoal text-white">
          <div className="max-w-6xl mx-auto px-5 py-20 grid lg:grid-cols-[1fr_1.2fr] gap-10">
            <div><h2 id="how-h" className="text-3xl font-bold tracking-tight">From booking to <span className="text-brand-lime">handover</span></h2><p className="text-brand-charcoal-text mt-3">Every step is tracked, every approval recorded, every part accounted for.</p></div>
            <ol className="space-y-3 list-none counter-reset">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-4 rounded-xl bg-brand-charcoal-mid border border-brand-charcoal-soft px-4 py-3"><span className="w-8 h-8 rounded-full bg-brand-lime text-brand-charcoal font-bold flex items-center justify-center shrink-0">{i + 1}</span>{s}</li>))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="hours-h" className="max-w-6xl mx-auto px-5 py-16 grid md:grid-cols-2 gap-8">
          <div><h2 id="hours-h" className="text-2xl font-bold">Workshop hours</h2>
            <dl className="mt-4 text-body-sm space-y-1.5"><div className="flex justify-between max-w-xs"><dt>Monday – Saturday</dt><dd><time>08:00</time> – <time>18:00</time></dd></div><div className="flex justify-between max-w-xs"><dt>Sunday</dt><dd>Closed</dd></div></dl></div>
          <address className="not-italic text-body-sm text-text-secondary"><h2 className="text-2xl font-bold text-text-primary mb-4">Visit us</h2>AutoCare Pro Workshop<br />Service Road, Bengaluru<br /><a className="underline" href="mailto:hello@autocare.example">hello@autocare.example</a></address>
        </section>
      </main>

      <footer className="border-t border-border"><div className="max-w-6xl mx-auto px-5 py-6 flex flex-wrap justify-between gap-3 text-caption text-text-muted"><p>© {new Date().getFullYear()} AutoCare Pro</p><ul className="flex gap-4"><li><Link to="/lab" className="hover:text-text-primary">Web tech lab demos</Link></li><li><Link to="/design-system" className="hover:text-text-primary">Design system</Link></li></ul></div></footer>
    </div>
  );
}
