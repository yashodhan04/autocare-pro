import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Menu, Search, Bell, ChevronDown, User2, Settings, LogOut,
  LifeBuoy, Palette, X, ExternalLink,
} from 'lucide-react';
import { cn } from '../../utils/cn.js';
import { NAV_GROUPS } from '../../config/nav.config.js';

/* ── Derive breadcrumb label from pathname ─────────────────── */
function useBreadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.replace(/^\/app\/?/, '').split('/').filter(Boolean);

  const allItems = NAV_GROUPS.flatMap((g) => g.items);

  if (segments.length === 0) return [{ label: 'Dashboard' }];

  return segments.map((seg, i) => {
    const path = '/app/' + segments.slice(0, i + 1).join('/');
    const match = allItems.find((item) => item.path === path);
    return {
      label: match?.label ?? seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      href:  i < segments.length - 1 ? path : undefined,
    };
  });
}

/* ── Notification panel (empty state until backend is live) ── */
function NotificationPanel({ onClose }) {
  return (
    <div
      className="absolute right-0 top-full mt-2 w-80 bg-surface-card rounded-2xl border border-border animate-scale-in origin-top-right"
      style={{ boxShadow: 'var(--shadow-modal)', zIndex: 200 }}
      role="dialog"
      aria-label="Notifications"
    >
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
        <p className="text-body-sm font-semibold text-text-primary">Notifications</p>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors"
          aria-label="Close notifications"
        >
          <X size={15} aria-hidden="true" />
        </button>
      </div>
      <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-4">
        <div className="w-12 h-12 rounded-2xl bg-surface-muted flex items-center justify-center text-text-muted mb-1">
          <Bell size={20} aria-hidden="true" />
        </div>
        <p className="text-body-sm font-medium text-text-primary">No notifications yet</p>
        <p className="text-caption text-text-muted max-w-[200px]">
          Alerts and updates will appear here when modules are connected.
        </p>
      </div>
    </div>
  );
}

/* ── User profile menu ─────────────────────────────────────── */
function UserMenu({ onClose }) {
  return (
    <div
      className="absolute right-0 top-full mt-2 w-64 bg-surface-card rounded-2xl border border-border animate-scale-in origin-top-right overflow-hidden"
      style={{ boxShadow: 'var(--shadow-modal)', zIndex: 200 }}
      role="menu"
      aria-label="User menu"
    >
      {/* Profile summary */}
      <div className="px-4 py-3.5 border-b border-border bg-surface-muted/30">
        <div className="flex items-center justify-between">
          <p className="text-body-sm font-semibold text-text-primary leading-tight">Workshop Admin</p>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-brand-charcoal text-brand-lime">
            Dev Mode
          </span>
        </div>
        <p className="text-caption text-text-muted mt-0.5">admin@autocarepro.local</p>
        <p className="text-[10px] text-text-muted mt-1">
          Authentication system will be implemented in Module 1.
        </p>
      </div>

      {/* Menu items */}
      <div className="py-1.5">
        {[
          { icon: User2,    label: 'Profile (Placeholder)',  href: '/app/profile' },
          { icon: Settings, label: 'Settings (Placeholder)', href: '/app/settings' },
          { icon: Palette,  label: 'Design System Showcase', href: '/design-system', external: false },
        ].map(({ icon: Icon, label, href, external }) => (
          <Link
            key={label}
            to={href}
            onClick={onClose}
            role="menuitem"
            className="flex items-center gap-2.5 px-4 py-2 text-body-sm text-text-primary hover:bg-surface-muted transition-colors"
          >
            <Icon size={15} className="text-text-muted shrink-0" aria-hidden="true" />
            <span className="flex-1">{label}</span>
          </Link>
        ))}
      </div>

      {/* Sign out */}
      <div className="border-t border-border py-1.5 px-4">
        <div className="text-[11px] text-text-muted py-1">
          No active auth session to terminate.
        </div>
      </div>
    </div>
  );
}

/* ── Search modal ──────────────────────────────────────────── */
function SearchModal({ onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const allRoutes = NAV_GROUPS.flatMap((g) =>
    g.items.map((item) => ({ ...item, group: g.groupLabel }))
  );

  const filteredRoutes = query.trim()
    ? allRoutes.filter(
        (r) =>
          r.label.toLowerCase().includes(query.toLowerCase()) ||
          r.group.toLowerCase().includes(query.toLowerCase()) ||
          r.path.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const quickLinks = allRoutes.slice(0, 8);

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-overlay animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl bg-surface-card rounded-2xl overflow-hidden animate-scale-in"
        style={{ boxShadow: 'var(--shadow-modal)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Global search"
      >
        {/* Search bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search size={18} className="text-text-muted shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to route (e.g. Customers, Appointments, Inventory)…"
            className="flex-1 bg-transparent text-body-sm text-text-primary placeholder:text-text-muted outline-none"
            aria-label="Search routes"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-text-muted hover:text-text-primary transition-colors p-1"
              aria-label="Clear search"
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-1 rounded bg-surface-muted text-text-muted text-[10px] font-mono border border-border">
            Esc
          </kbd>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {query.trim() ? (
            filteredRoutes.length > 0 ? (
              <div>
                <p className="text-overline text-text-muted uppercase mb-2">
                  Matching Application Routes ({filteredRoutes.length})
                </p>
                <div className="space-y-1">
                  {filteredRoutes.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.id}
                        to={item.path}
                        onClick={onClose}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-body-sm text-text-primary hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-surface-muted flex items-center justify-center text-text-muted">
                            <Icon size={15} aria-hidden="true" />
                          </div>
                          <div>
                            <span className="font-medium text-text-primary">{item.label}</span>
                            <span className="text-caption text-text-muted ml-2">in {item.group}</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-text-muted">{item.path}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 gap-2 text-center">
                <Search size={24} className="text-text-muted" aria-hidden="true" />
                <p className="text-body-sm font-medium text-text-primary">
                  No matching route for &ldquo;{query}&rdquo;
                </p>
                <p className="text-caption text-text-muted max-w-sm">
                  Full-text record search across customers, vehicles, and jobs will activate once MongoDB business modules are connected.
                </p>
              </div>
            )
          ) : (
            <div>
              <p className="text-overline text-text-muted uppercase mb-3">Quick Navigation</p>
              <div className="grid grid-cols-2 gap-1.5">
                {quickLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={onClose}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-body-sm text-text-primary hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime"
                    >
                      <Icon size={15} className="text-text-muted shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-border bg-surface-muted/50 flex items-center justify-between text-caption text-text-muted">
          <span>Route navigation preview • Database search in Module 2+</span>
          <button
            type="button"
            onClick={onClose}
            className="hover:text-text-primary transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/*  TopNav                                                    */
/* ══════════════════════════════════════════════════════════ */

/**
 * TopNav — Application top navigation bar.
 *
 * Props:
 *   onMobileMenuOpen  () => void   — opens the mobile sidebar drawer
 *   sidebarCollapsed  boolean
 */
export function TopNav({ onMobileMenuOpen, sidebarCollapsed }) {
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [userOpen,    setUserOpen]    = useState(false);

  const notifRef = useRef(null);
  const userRef  = useRef(null);

  const breadcrumbs = useBreadcrumbs();

  // Close menus on outside click
  useEffect(() => {
    function handler(e) {
      if (notifOpen && notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userOpen  && userRef.current  && !userRef.current.contains(e.target))  setUserOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen, userOpen]);

  // Global keyboard shortcuts: "/" or "Ctrl+K" / "Cmd+K" to open search
  useEffect(() => {
    function handleKeyDown(e) {
      const tag = e.target?.tagName?.toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || e.target?.isContentEditable;
      if (
        (e.key === '/' && !isInput) ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')
      ) {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const closeAll = useCallback(() => {
    setNotifOpen(false);
    setUserOpen(false);
  }, []);


  return (
    <>
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}

      <header
        className={cn(
          'sticky top-0 z-[200] flex h-14 items-center gap-3 px-4 shrink-0',
          'bg-surface-card/95 backdrop-blur-sm border-b border-border',
        )}
        style={{ boxShadow: 'var(--shadow-xs)' }}
      >
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 -ml-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime"
          aria-label="Open navigation menu"
        >
          <Menu size={20} aria-hidden="true" />
        </button>

        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center min-w-0 flex-1">
          <ol className="flex items-center gap-1 text-caption truncate">
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <li key={i} className="flex items-center gap-1 shrink-0">
                  {i > 0 && (
                    <span className="text-text-muted select-none" aria-hidden="true">/</span>
                  )}
                  {isLast ? (
                    <span className="font-semibold text-text-primary" aria-current="page">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      to={crumb.href || '#'}
                      className="text-text-muted hover:text-text-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Mobile: page title only */}
        <p className="sm:hidden font-semibold text-text-primary truncate flex-1">
          {breadcrumbs[breadcrumbs.length - 1]?.label}
        </p>

        {/* Right-side controls */}
        <div className="flex items-center gap-1 ml-auto shrink-0">
          {/* Global search */}
          <button
            type="button"
            onClick={() => { closeAll(); setSearchOpen(true); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors text-body-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime"
            aria-label="Open global search"
          >
            <Search size={16} aria-hidden="true" />
            <span className="hidden md:inline text-text-muted">Search…</span>
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface-muted text-[10px] font-mono border border-border text-text-muted">
              /
            </kbd>
          </button>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => { setUserOpen(false); setNotifOpen((v) => !v); }}
              className="relative p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime"
              aria-label="View notifications"
              aria-expanded={notifOpen}
              aria-haspopup="dialog"
            >
              <Bell size={18} aria-hidden="true" />
            </button>
            {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-border mx-1" aria-hidden="true" />

          {/* User menu */}
          <div ref={userRef} className="relative">
            <button
              type="button"
              onClick={() => { setNotifOpen(false); setUserOpen((v) => !v); }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime"
              aria-label="Open user menu"
              aria-expanded={userOpen}
              aria-haspopup="menu"
            >
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-brand-charcoal flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-brand-lime select-none">WA</span>
              </div>
              <span className="hidden md:block text-body-sm font-medium text-text-primary">Admin</span>
              <ChevronDown size={13} className="hidden md:block text-text-muted" aria-hidden="true" />
            </button>
            {userOpen && <UserMenu onClose={() => setUserOpen(false)} />}
          </div>
        </div>
      </header>
    </>
  );
}
