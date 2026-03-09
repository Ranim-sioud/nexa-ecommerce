import { useState, Suspense, lazy, memo, useEffect } from "react";
import { PageLoader } from "./ui/Loader";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider } from "./ui/sidebar";
import { Toaster } from "./ui/sonner";
import { AppSidebar as RawAppSidebar } from "./AppSidebar";
import { Navbar as RawNavbar } from "./Navbar";
import { useAuth } from "../context/AuthContext";

const FloatingSupportButton = lazy(() => import("./FloatingSupportButton"));

const AppSidebar = memo(RawAppSidebar);
const Navbar = memo(RawNavbar);

export function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, isLoading, isFetching, logout } = useAuth();
  const navigate = useNavigate();

  // Not authenticated → redirect (moved to useEffect to avoid navigate-in-render warning)
  useEffect(() => {
    if (!isLoading && !isFetching && !user) {
      navigate("/auth/login", { replace: true });
    }
  }, [user, isLoading, isFetching, navigate]);

  // Show loader while the /users/me query is in flight
  if (isLoading || isFetching) return <PageLoader />;

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50/50 dark:bg-gray-900">
        <div className="top-0 h-screen">
          <AppSidebar
            isMobileOpen={isSidebarOpen}
            setIsMobileOpen={setIsSidebarOpen}
            onLogout={logout}
            onThemeChange={() => {}}
          />
        </div>

        <div className="flex-1 flex flex-col">
          <Navbar
            user={user}
            onMenuClick={() => setIsSidebarOpen((prev) => !prev)}
            onCartClick={() => {}}
            activeSection="dashboard"
          />
          <main className="flex-1 overflow-auto p-4">
            <Outlet />
          </main>
        </div>

        <Suspense fallback={null}>
          <FloatingSupportButton />
        </Suspense>

        <Toaster />
      </div>
    </SidebarProvider>
  );
}
