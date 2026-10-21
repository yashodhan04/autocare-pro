import { Link } from 'react-router-dom';

/**
 * PlaceholderPage.jsx
 *
 * Step 1 scaffold confirmation page.
 * Shown at all routes until real pages are built in later steps.
 * Uses inline styles only — no Tailwind dependency during initial scaffolding.
 */
function PlaceholderPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1A1D23',
        color: '#F4F5F7',
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: '2rem',
        gap: '1.25rem',
        textAlign: 'center',
      }}
    >
      {/* Brand mark */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 16,
          backgroundColor: '#C6F135',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 34,
          marginBottom: 4,
          boxShadow: '0 0 32px rgba(198,241,53,0.25)',
        }}
        aria-hidden="true"
      >
        🔧
      </div>

      <h1
        style={{
          fontSize: '2rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          margin: 0,
          lineHeight: 1.1,
        }}
      >
        <span style={{ color: '#C6F135' }}>AutoCare</span>{' '}Pro
      </h1>

      <p
        style={{
          fontSize: '1rem',
          color: '#9BA3AF',
          maxWidth: 400,
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        Vehicle Service &amp; Workshop Management System
      </p>

      {/* Stack confirmation badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          backgroundColor: '#22262F',
          border: '1px solid #2C3140',
          borderRadius: 8,
          padding: '0.6rem 1.2rem',
          fontSize: '0.875rem',
          color: '#C6F135',
          fontWeight: 600,
          marginTop: 8,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#22C55E',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        React 19 + Vite + JavaScript &mdash; Stack confirmed ✓
      </div>

      {/* Info panel */}
      <div
        style={{
          marginTop: 8,
          fontSize: '0.8125rem',
          color: '#9BA3AF',
          backgroundColor: '#22262F',
          borderRadius: 8,
          padding: '1rem 1.5rem',
          textAlign: 'left',
          lineHeight: 2,
          border: '1px solid #2C3140',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          minWidth: 320,
        }}
      >
        <div>Frontend  <span style={{ color: '#C6F135' }}>http://localhost:5173</span></div>
        <div>Backend   <span style={{ color: '#C6F135' }}>http://localhost:5000</span></div>
        <div>Health    <span style={{ color: '#C6F135' }}>GET /api/v1/health</span></div>
        <div>Readiness <span style={{ color: '#C6F135' }}>GET /api/v1/health/ready</span></div>
      </div>

      {/* Action links */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          to="/app/dashboard"
          style={{
            backgroundColor: '#C6F135',
            color: '#1A1D23',
            padding: '0.625rem 1.25rem',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '0.875rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          Enter Dashboard &rarr;
        </Link>
        <Link
          to="/design-system"
          style={{
            backgroundColor: '#22262F',
            color: '#F4F5F7',
            padding: '0.625rem 1.25rem',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            border: '1px solid #2C3140',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          Design System
        </Link>
      </div>

      <p
        style={{
          fontSize: '0.75rem',
          color: '#4B5563',
          margin: 0,
          marginTop: 4,
        }}
      >
        Step 3 — Application Shell &amp; Layout Active
      </p>
    </div>
  );
}

export default PlaceholderPage;
