import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Lab demonstrations for the Web Technologies coursework (see docs/ASSIGNMENT_COVERAGE.md).
 * The rest of the app uses React state-driven rendering; this page deliberately shows the
 * "classic" techniques side by side: explicit DOM manipulation (Assignment 11), string
 * manipulation + validation (7, 12), array methods (6) and session storage (12).
 */
const SERVICES = [
  { name: 'Oil change', price: 1200, minutes: 45 }, { name: 'Brake inspection', price: 600, minutes: 45 },
  { name: 'AC service', price: 1800, minutes: 90 }, { name: 'Tyre rotation', price: 900, minutes: 60 }, { name: 'Battery replacement', price: 400, minutes: 30 },
];

function DomDemo() {
  const listRef = useRef(null);
  const inputRef = useRef(null);
  // Direct DOM manipulation (createElement / appendChild / classList / remove) — Assignment 11
  function add() {
    const text = inputRef.current.value.trim();
    if (!text) return inputRef.current.focus();
    const li = document.createElement('li');
    li.className = 'flex justify-between items-center px-3 py-2 border border-border rounded-lg bg-surface-card';
    const span = document.createElement('span'); span.textContent = text;
    const rm = document.createElement('button'); rm.type = 'button'; rm.textContent = 'Remove'; rm.className = 'text-caption text-danger underline';
    rm.addEventListener('click', () => li.remove());
    span.addEventListener('click', () => li.classList.toggle('bg-brand-lime-muted'));
    li.append(span, rm);
    listRef.current.appendChild(li);
    inputRef.current.value = ''; inputRef.current.focus();
  }
  return (
    <section aria-labelledby="dom-h" className="card p-5 space-y-3"><h2 id="dom-h" className="text-h4 font-semibold">Assignment 11 — DOM manipulation &amp; events</h2>
      <p className="text-body-sm text-text-secondary">A job checklist built with <code>createElement</code>, <code>appendChild</code>, <code>classList.toggle</code> and <code>remove()</code>. Click an item to highlight it.</p>
      <div className="flex gap-2"><input ref={inputRef} aria-label="Checklist item" className="form-input" placeholder="e.g. Check wiper blades" onKeyDown={(e) => e.key === 'Enter' && add()} /><button type="button" className="btn btn-primary btn-md" onClick={add}>Add</button></div>
      <ul ref={listRef} className="space-y-2" aria-live="polite" />
    </section>
  );
}

function StringDemo() {
  const [raw, setRaw] = useState('');
  // String manipulation: strip, uppercase, validate Indian registration pattern, format
  const cleaned = raw.replace(/[^a-z0-9]/gi, '').toUpperCase();
  const valid = /^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$/.test(cleaned);
  const pretty = valid ? cleaned.replace(/^([A-Z]{2})(\d{2})([A-Z]{1,3})(\d{4})$/, '$1 $2 $3 $4') : cleaned;
  return (
    <section aria-labelledby="str-h" className="card p-5 space-y-3"><h2 id="str-h" className="text-h4 font-semibold">Assignments 7 &amp; 12 — validation &amp; string handling</h2>
      <label htmlFor="reg" className="form-label">Vehicle registration number</label>
      <input id="reg" className={`form-input ${raw && !valid ? 'form-input-error' : ''}`} value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="ka-01 ab 1234" aria-invalid={raw && !valid ? 'true' : undefined} aria-describedby="reg-out" />
      <p id="reg-out" className="text-body-sm" role="status">{!raw ? 'Type a registration number.' : valid ? <>✔ Valid — stored as <code>{cleaned}</code>, displayed as <strong>{pretty}</strong></> : <span className="text-danger">✖ Expected format like KA01AB1234 (state, district, series, number)</span>}</p>
    </section>
  );
}

function ArrayDemo() {
  const [max, setMax] = useState(1500);
  // Array methods: filter → map → reduce
  const affordable = useMemo(() => SERVICES.filter((s) => s.price <= max), [max]);
  const total = affordable.reduce((sum, s) => sum + s.price, 0);
  const names = affordable.map((s) => s.name.toUpperCase());
  return (
    <section aria-labelledby="arr-h" className="card p-5 space-y-3"><h2 id="arr-h" className="text-h4 font-semibold">Assignment 6 — array methods</h2>
      <label htmlFor="max" className="form-label">Budget per service: ₹{max}</label>
      <input id="max" type="range" min="300" max="2000" step="100" value={max} onChange={(e) => setMax(Number(e.target.value))} className="w-full accent-brand-charcoal" />
      <p className="text-body-sm"><code>filter</code> → {affordable.length} services · <code>reduce</code> → total ₹{total} · <code>map</code> → {names.join(', ') || '—'}</p>
    </section>
  );
}

function SessionDemo() {
  // sessionStorage = per-tab "session" concept (the app's real sessions are httpOnly cookies, see Assignment 12 notes)
  const read = () => { try { return Number(sessionStorage.getItem('lab-visits') ?? 0); } catch { return 0; } };
  const [visits, setVisits] = useState(read);
  const bump = () => { const n = read() + 1; try { sessionStorage.setItem('lab-visits', String(n)); } catch { /* storage blocked */ } setVisits(n); };
  return (
    <section aria-labelledby="ses-h" className="card p-5 space-y-3"><h2 id="ses-h" className="text-h4 font-semibold">Assignment 12 — session concepts</h2>
      <p className="text-body-sm text-text-secondary">This counter lives in <code>sessionStorage</code> and survives a refresh but not a new tab. Real authentication in AutoCare Pro uses a signed JWT in an httpOnly cookie.</p>
      <button type="button" className="btn btn-outline btn-md" onClick={bump}>Clicked {visits} time{visits === 1 ? '' : 's'} this session</button>
    </section>
  );
}

export default function LabDemoPage() {
  return (
    <div className="min-h-screen bg-surface-page"><main className="max-w-3xl mx-auto p-5 sm:p-10 space-y-6">
      <header><Link to="/" className="text-caption underline text-text-secondary">← AutoCare Pro</Link><h1 className="text-3xl font-bold tracking-tight mt-2">Web technologies lab demos</h1><p className="text-text-secondary mt-1">Small, focused demonstrations of coursework concepts. See <code>docs/ASSIGNMENT_COVERAGE.md</code>.</p></header>
      <DomDemo /><StringDemo /><ArrayDemo /><SessionDemo />
    </main></div>
  );
}
