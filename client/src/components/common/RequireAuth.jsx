import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { EmptyState } from '../ui/States.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import { ShieldAlert } from 'lucide-react';

/** Gate: must be signed in (and, optionally, hold one of `roles`). */
export function RequireAuth({ roles, children }) {
  const { isAuthenticated, loading, role } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-8 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-40 w-full" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (roles && !roles.includes(role)) {
    return <div className="p-8"><EmptyState icon={<ShieldAlert size={28} />} title="Access restricted" message="Your role doesn't have access to this area. Contact a workshop administrator if you think this is a mistake." /></div>;
  }
  return children ?? <Outlet />;
}

/** Keeps signed-in users out of login/register. */
export function GuestOnly({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/app/dashboard" replace /> : children;
}
