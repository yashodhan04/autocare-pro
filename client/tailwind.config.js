/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── AutoCare Pro Brand Palette ──────────────────────────
        brand: {
          lime:            '#C8F135',   // Primary accent — electric lime
          'lime-hover':    '#B8E020',   // Lime on hover
          'lime-muted':    '#EAF9A0',   // Lime tint for backgrounds
          charcoal:        '#18191F',   // Navigation, sidebar, dark surfaces
          'charcoal-mid':  '#22262F',   // Cards on dark bg
          'charcoal-soft': '#2C3140',   // Borders on dark bg
          'charcoal-text': '#9BA3AF',   // Muted text on dark bg
        },

        // ── Surface / Background ────────────────────────────────
        surface: {
          page:    '#F5F6F8',   // Main page background
          card:    '#FFFFFF',   // Card background
          muted:   '#F0F1F4',   // Muted surface (table rows, inputs)
          overlay: 'rgba(0,0,0,0.45)',  // Modal backdrop
        },

        // ── Text ────────────────────────────────────────────────
        text: {
          primary:   '#18191F',   // Main body text
          secondary: '#5A6070',   // Supporting text
          muted:     '#8B93A5',   // Placeholders, metadata
          disabled:  '#B8BDC9',   // Disabled state text
          inverse:   '#FFFFFF',   // Text on dark/lime backgrounds
        },

        // ── Border ──────────────────────────────────────────────
        border: {
          DEFAULT:  '#E3E6ED',
          strong:   '#C8CDD9',
          focus:    '#C8F135',   // Focus ring — lime
        },

        // ── Semantic ─────────────────────────────────────────────
        success: {
          DEFAULT: '#16A34A',
          light:   '#F0FDF4',
          muted:   '#DCFCE7',
          text:    '#14532D',
        },
        warning: {
          DEFAULT: '#D97706',
          light:   '#FFFBEB',
          muted:   '#FEF3C7',
          text:    '#78350F',
        },
        danger: {
          DEFAULT: '#DC2626',
          light:   '#FFF1F2',
          muted:   '#FEE2E2',
          text:    '#7F1D1D',
        },
        info: {
          DEFAULT: '#2563EB',
          light:   '#EFF6FF',
          muted:   '#DBEAFE',
          text:    '#1E3A8A',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      },

      fontSize: {
        // Custom scale with tight leading for headings
        'display':   ['2.5rem',  { lineHeight: '1.1',  letterSpacing: '-0.03em', fontWeight: '700' }],
        'h1':        ['2rem',    { lineHeight: '1.15', letterSpacing: '-0.025em', fontWeight: '700' }],
        'h2':        ['1.5rem',  { lineHeight: '1.2',  letterSpacing: '-0.02em', fontWeight: '600' }],
        'h3':        ['1.25rem', { lineHeight: '1.3',  letterSpacing: '-0.015em', fontWeight: '600' }],
        'h4':        ['1.125rem',{ lineHeight: '1.4',  letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-lg':   ['1.0625rem',{ lineHeight: '1.65' }],
        'body':      ['0.9375rem',{ lineHeight: '1.6'  }],
        'body-sm':   ['0.875rem', { lineHeight: '1.55' }],
        'caption':   ['0.8125rem',{ lineHeight: '1.5'  }],
        'overline':  ['0.75rem',  { lineHeight: '1.4', letterSpacing: '0.08em', fontWeight: '600' }],
        'label':     ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],
      },

      borderRadius: {
        sm:   '4px',
        md:   '8px',
        lg:   '10px',
        xl:   '14px',
        '2xl':'18px',
        card: '12px',
        pill: '9999px',
      },

      boxShadow: {
        xs:         '0 1px 2px 0 rgba(0,0,0,0.05)',
        sm:         '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.05)',
        card:       '0 1px 4px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.05)',
        'card-hover':'0 6px 20px 0 rgba(0,0,0,0.10), 0 2px 6px -2px rgba(0,0,0,0.06)',
        md:         '0 4px 12px 0 rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.05)',
        lg:         '0 10px 30px 0 rgba(0,0,0,0.10), 0 4px 8px -4px rgba(0,0,0,0.06)',
        nav:        '4px 0 20px 0 rgba(0,0,0,0.20)',
        modal:      '0 24px 64px 0 rgba(0,0,0,0.18), 0 8px 24px 0 rgba(0,0,0,0.10)',
        'focus-lime':'0 0 0 3px rgba(200,241,53,0.35)',
        'focus-blue':'0 0 0 3px rgba(37,99,235,0.20)',
        'focus-red': '0 0 0 3px rgba(220,38,38,0.20)',
        inner:      'inset 0 1px 3px 0 rgba(0,0,0,0.06)',
      },

      spacing: {
        '4.5': '1.125rem',
        '13':  '3.25rem',
        '15':  '3.75rem',
        '18':  '4.5rem',
        '22':  '5.5rem',
        '68':  '17rem',
        '72':  '18rem',
        '80':  '20rem',
        '88':  '22rem',
        '240': '60rem',
      },

      maxWidth: {
        'prose-narrow': '55ch',
        'prose':        '68ch',
        'page':         '1280px',
      },

      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
      },

      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      animation: {
        'fade-in':    'fadeIn 0.2s ease-out both',
        'fade-out':   'fadeOut 0.15s ease-in both',
        'slide-up':   'slideUp 0.25s cubic-bezier(0.4,0,0.2,1) both',
        'slide-down': 'slideDown 0.2s cubic-bezier(0.4,0,0.2,1) both',
        'scale-in':   'scaleIn 0.2s cubic-bezier(0.4,0,0.2,1) both',
        'spin-slow':  'spin 2.4s linear infinite',
        'shimmer':    'shimmer 1.6s linear infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },

      keyframes: {
        fadeIn:    { from: { opacity: '0' },                                      to: { opacity: '1' } },
        fadeOut:   { from: { opacity: '1' },                                      to: { opacity: '0' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(10px)' },       to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-10px)' },      to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.96)' },            to: { opacity: '1', transform: 'scale(1)' } },
        shimmer:   { from: { backgroundPosition: '-200% 0' },                     to: { backgroundPosition: '200% 0' } },
        pulseSoft: { '0%,100%': { opacity: '1' },                                 '50%': { opacity: '0.5' } },
      },

      zIndex: {
        dropdown: '100',
        sticky:   '200',
        modal:    '300',
        toast:    '400',
        tooltip:  '500',
      },
    },
  },
  plugins: [],
};
