import { useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Wrench, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn.js';
import { NAV_GROUPS } from '../../config/nav.config.js';
import { Tooltip } from '../ui/Tooltip.jsx';

/**
 * Sidebar — AutoCare Pro dark charcoal navigation sidebar.
 *
 * Desktop: fixed left panel that can collapse to icon-only mode.
 * Mobile:  off-canvas drawer controlled by `mobileOpen`.
 *
 * Props:
 *   collapsed    boolean          — desktop collapsed state
 *   onToggle     () => void       — desktop expand/collapse toggle
 *   mobileOpen   boolean          — mobile drawer visible
 *   onMobileClose () => void      — close mobile drawer
 */
export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const drawerRef = useRef(null);

  // Close mobile drawer on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onMobileClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mobileOpen, onMobileClose]);

  // Trap focus to drawer when open and restore on close
  useEffect(() => {
    if (mobileOpen) {
      drawerRef.current?.querySelector('a,button')?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const sidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full">
      {/* ── Brand / Logo ─────────────────────────────── */}
      <div
        className={cn(
          'flex items-center shrink-0 border-b border-brand-charcoal-soft',
          collapsed && !isMobile ? 'justify-center px-0 py-4' : 'gap-3 px-4 py-4',
        )}
      >
        <Link
          to="/app/dashboard"
          onClick={isMobile ? onMobileClose : undefined}
          className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime rounded-lg"
          aria-label="AutoCare Pro — go to dashboard"
        >
          <div className="w-9 h-9 rounded-xl bg-brand-lime flex items-center justify-center shrink-0">
            <Wrench size={18} className="text-brand-charcoal" aria-hidden="true" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-tight tracking-tight">
                AutoCare <span className="text-brand-lime">Pro</span>
              </p>
              <p className="text-[10px] text-brand-charcoal-text font-medium tracking-wide uppercase">
                Workshop Management
              </p>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        {isMobile && (
          <button
            type="button"
            onClick={onMobileClose}
            className="ml-auto p-1.5 rounded-lg text-brand-charcoal-text hover:text-white hover:bg-brand-charcoal-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime"
            aria-label="Close navigation"
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* ── Navigation ────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-none"
        aria-label="Main navigation"
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.groupLabel} className="mb-1">
            {/* Group label — hidden when collapsed */}
            {(!collapsed || isMobile) && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-charcoal-text px-4 pt-4 pb-1.5 select-none">
                {group.groupLabel}
              </p>
            )}
            {collapsed && !isMobile && (
              /* Thin divider in collapsed mode */
              <div className="mx-3 my-2 border-t border-brand-charcoal-soft" aria-hidden="true" />
            )}

            <ul role="list" className="space-y-0.5 px-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                const link = (
                  <NavLink
                    to={item.path}
                    onClick={isMobile ? onMobileClose : undefined}
                    className={({ isActive }) =>
                      cn(
                        'relative flex items-center gap-3 rounded-lg text-sm font-medium',
                        'transition-colors duration-150',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime',
                        collapsed && !isMobile
                          ? 'justify-center px-0 py-2.5 w-full'
                          : 'px-3 py-2.5',
                        isActive
                          ? 'bg-brand-lime text-brand-charcoal'
                          : 'text-brand-charcoal-text hover:text-white hover:bg-brand-charcoal-soft',
                      )
                    }
                    aria-label={collapsed && !isMobile ? item.label : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        {/* Active indicator bar */}
                        {isActive && (
                          <span
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-brand-charcoal opacity-30"
                            aria-hidden="true"
                          />
                        )}
                        <Icon
                          size={17}
                          aria-hidden="true"
                          className="shrink-0"
                        />
                        {(!collapsed || isMobile) && (
                          <span className="truncate">{item.label}</span>
                        )}
                        {item.badge && (!collapsed || isMobile) && (
                          <span className="ml-auto min-w-[20px] text-center text-[10px] font-bold rounded-full px-1.5 py-0.5 bg-brand-charcoal/20 text-brand-charcoal leading-none">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );

                return (
                  <li key={item.id}>
                    {collapsed && !isMobile ? (
                      <Tooltip content={item.label} side="right" delay={200}>
                        {link}
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Bottom collapse toggle (desktop only) ────── */}
      {!isMobile && (
        <div className="shrink-0 border-t border-brand-charcoal-soft p-2">
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              'flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5',
              'text-brand-charcoal-text hover:text-white hover:bg-brand-charcoal-soft',
              'transition-colors duration-150 text-sm font-medium',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime',
              collapsed && 'justify-center px-0',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <ChevronRight size={16} aria-hidden="true" />
              : (
                <>
                  <ChevronLeft size={16} aria-hidden="true" />
                  <span>Collapse</span>
                </>
              )
            }
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────── */}
      <aside
        className={cn(
          'hidden lg:flex flex-col shrink-0',
          'bg-brand-charcoal h-screen sticky top-0',
          'transition-[width] duration-300 ease-smooth overflow-hidden',
          collapsed ? 'w-[60px]' : 'w-60',
        )}
        style={{ boxShadow: 'var(--shadow-nav)' }}
        aria-label="Application navigation"
      >
        {sidebarContent(false)}
      </aside>

      {/* ── Mobile backdrop ──────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[280] bg-surface-overlay lg:hidden animate-fade-in"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile off-canvas drawer ─────────────────── */}
      <aside
        ref={drawerRef}
        className={cn(
          'fixed inset-y-0 left-0 z-[290] flex flex-col w-72',
          'bg-brand-charcoal lg:hidden',
          'transition-transform duration-300 ease-smooth',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ boxShadow: 'var(--shadow-nav)' }}
        aria-label="Mobile navigation"
        aria-hidden={!mobileOpen}
      >
        {sidebarContent(true)}
      </aside>
    </>
  );
}
