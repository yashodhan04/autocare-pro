import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar.jsx';
import { TopNav } from '../components/layout/TopNav.jsx';
import { ToastContainer, useToast } from '../components/ui/Toast.jsx';
import { useMediaQuery } from '../hooks/useMediaQuery.js';

/**
 * AppLayout — Authenticated application shell.
 *
 * Renders:
 *  - Collapsible dark sidebar (desktop)
 *  - Off-canvas mobile drawer
 *  - Sticky top navigation bar
 *  - Main scrollable content area (via <Outlet />)
 *  - Global ToastContainer
 *
 * Children receive the toast API via React context in a later step;
 * for now the layout owns the toast state.
 */
export default function AppLayout() {
  const isMobile = useMediaQuery('(max-width: 1023px)');

  // Desktop: sidebar collapsed state (persisted to localStorage)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Mobile: drawer open state
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleToggle() {
    setCollapsed((v) => {
      const next = !v;
      try { localStorage.setItem('sidebar-collapsed', String(next)); } catch {}
      return next;
    });
  }

  function handleMobileOpen()  { setMobileOpen(true);  }
  function handleMobileClose() { setMobileOpen(false); }

  // Toast state at layout level so any child page can fire toasts
  const { toasts, dismiss } = useToast();

  return (
    <div className="flex h-screen overflow-hidden bg-surface-page">
      {/* Sidebar */}
      <Sidebar
        collapsed={isMobile ? false : collapsed}
        onToggle={handleToggle}
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileClose}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top navigation */}
        <TopNav
          onMobileMenuOpen={handleMobileOpen}
          sidebarCollapsed={collapsed}
        />

        {/* Page content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto overflow-x-hidden"
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>

      {/* Global toast container */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
