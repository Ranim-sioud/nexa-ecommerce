import React, { useEffect, useState, Suspense, lazy, memo } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider } from "./ui/sidebar";
import { Toaster } from "./ui/sonner";
import axios from "axios";
import { AppSidebar as RawAppSidebar } from "./AppSidebar";
import { Navbar as RawNavbar } from "./Navbar";
import api from "./api";

const FloatingSupportButton = lazy(() => import("./FloatingSupportButton"));

// Memoiser les composants pour réduire les re-renders
const AppSidebar = memo(RawAppSidebar);
const Navbar = memo(RawNavbar);
 
export function DashboardLayout() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  const handleCartClick = () => setIsCartOpen(true);
  const handleCloseProductModal = () => {
    setIsProductModalOpen(false);
    setSelectedProduct(null);
  };

  useEffect(() => {
  async function fetchUser() {
    try {
      // Utiliser l'API qui se base sur les cookies automatiquement
      const res = await api.get("/users/me");
      setUser(res.data);
    } catch (err) {
      console.error("Erreur fetchUser:", err);
      
      // Si 401, essayer de rafraîchir le token via le refresh token automatique
      if (err.response?.status === 401) {
        try {
          // Refresh token automatique via l'interceptor d'axios
          await api.post("/auth/refresh");
          // Réessayer après refresh
          const res = await api.get("/users/me");
          setUser(res.data);
        } catch (refreshErr) {
          console.error("Refresh failed:", refreshErr);
          // Rediriger vers login
          navigate("/auth/login");
        }
      } else {
        navigate("/auth/login");
      }
    }
  }

  fetchUser();
}, [navigate]);

  if (!user)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Chargement...
      </div>
    );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50/50 dark:bg-gray-900">
        <div className="top-0 h-screen">
          <AppSidebar
            isMobileOpen={isSidebarOpen}
            setIsMobileOpen={setIsSidebarOpen}
            onLogout={() => {}}
            onThemeChange={() => {}}
          />
        </div>

        <div className="flex-1 flex flex-col">
          <Navbar
            user={user}
            onMenuClick={() => setIsSidebarOpen((prev) => !prev)}
            onCartClick={handleCartClick}
            activeSection="dashboard"
          />
          <main className="flex-1 overflow-auto p-4">
            <Outlet />
          </main>
        </div>

        {/* Suspense permet d'afficher un fallback pendant le lazy load */}
        <Suspense fallback={null}>
          {/*
          <ProductModal
            product={selectedProduct}
            isOpen={isProductModalOpen}
            onClose={handleCloseProductModal}
          /> */}
          <FloatingSupportButton />
        </Suspense>

        <Toaster />
      </div>
    </SidebarProvider>
  );
}