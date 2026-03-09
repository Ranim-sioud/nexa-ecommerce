/**
 * ProtectedRoute — Sub-Sprint 4
 *
 * Use as a layout route in React Router v7 to guard a group of child routes:
 *
 *   <Route element={<ProtectedRoute roles={['admin']} />}>
 *     <Route path="/admin/users" element={<AdminUsers />} />
 *   </Route>
 *
 * Behaviour:
 *   • Still loading  → full-page loader (prevents flash)
 *   • Not logged in  → redirect to /auth/login
 *   • Wrong role     → redirect to /dashboard (authenticated but no access)
 *   • OK             → render <Outlet /> (the matched child route)
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';
import { PageLoader } from './ui/Loader';

interface ProtectedRouteProps {
  /** Allowed roles. Omit (or pass empty array) to allow any authenticated user. */
  roles?: UserRole[];
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user, isLoading, isFetching } = useAuth();

  if (isLoading || isFetching) return <PageLoader />;

  if (!user) return <Navigate to="/auth/login" replace />;

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
