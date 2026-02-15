import { useState, useEffect } from "react";
import {
  Home, ShoppingBag, Package, CreditCard, BarChart3, MessageCircle,
  Settings, Store, ChevronLeft, ChevronRight, LogOut, Moon, Sun,
  Shield, Users, User, ClipboardList, Target, Key, Truck,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import logo from '../assets/logo.png';
import { logout } from './utils/auth';
import api from "./api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const menuItems = {
  vendeur: [
    { title: "Tableau de Bord", icon: Home, path: "/dashboard", badge: null },
    { title: "Marketplace", icon: Store, path: "/marketplace", badge: "149" },
    { title: "Mes Produits", icon: Package, path: "/MesProduits", badge: null },
    { title: "Commandes", icon: CreditCard, path: "/ListeCommandes", badge: null },
    { title: "Transactions", icon: CreditCard, path: "/transaction", badge: null },
    { title: "Parrainage", icon: Users, path: "/vendeurParrainage" },
    { title: "Support", icon: MessageCircle, path: "/ticket", badge: "Nouveau" },
    { title: "Paramètres", icon: Settings, path: "/settings", badge: null },
  ],
  fournisseur: [
    { title: "Tableau de Bord", icon: Home, path: "/dashboardF" },
    { title: "Produits", icon: Package, path: "/ProductList" },
    { title: "Commandes", icon: ShoppingBag, path: "/ListeCommandeFournisseur" },
    { title: "Pickups", icon: Truck, path: "/pickup" },
    { title: "Transactions", icon: CreditCard, path: "/transaction" },
    { title: "Support", icon: MessageCircle, path: "/ticket", badge: "Nouveau" },
    { title: "Paramètres", icon: Settings, path: "/settings" }
  ],
  admin: [
    { title: "Tableau de Bord", icon: Home, path: "/adminDashboard", hasSubmenu: true },
    { title: "Produits", icon: Package, path: "/ProductList" },
    { title: "Commandes", icon: ShoppingBag, path: "/ListeCommandeFournisseur" },
    { title: "Pickups", icon: Truck, path: "/pickup" },
    { title: "Utilisateurs", icon: Users, path: "/adminUsers" },
    { title: "Parrainage", icon: Users, path: "/AdminParrainage" },
    { title: "Spécialistes", icon: Shield, path: "/admin/specialists" },
    { title: "Permissions", icon: Key, path: "/admin/permissions" },
    { title: "Tâches", icon: ClipboardList, path: "/admin/tasks" },
    { title: "Support", icon: MessageCircle, path: "/ticket" },
    { title: "Paramètres", icon: Settings, path: "/settings" },
  ],
  specialiste: [
    { title: "Tableau de Bord", icon: Home, path: "/specialist/dashboard" },
    { title: "Gestion Utilisateurs", icon: Users, path: "/specialist/users" },
    { title: "Gestion Produits", icon: Package, path: "/specialist/products" },
    { title: "Mes Tâches", icon: ClipboardList, path: "/specialist/tasks" },
    { title: "Support", icon: MessageCircle, path: "/ticket" },
    { title: "Paramètres", icon: Settings, path: "/settings" },
  ]
};

export function AppSidebar({ onLogout, onThemeChange, isMobileOpen, setIsMobileOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const storedUser = localStorage.getItem("user");
  const [user, setUser] = useState(storedUser ? JSON.parse(storedUser) : null);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [adminDashboardOpen, setAdminDashboardOpen]= useState(false);

  // Détection des breakpoints
  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024;
  const isDesktop = windowSize.width >= 1024;
  const isMobileOrTablet = isMobile || isTablet;

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
  const fetchUser = async () => {
    try {
      // NE PAS utiliser localStorage pour le token
      // L'API utilise les cookies automatiquement via withCredentials
      const res = await api.get("/users/me");
      setUser(res.data);
      
      // Optional: stocker uniquement les infos utilisateur (sans token)
      localStorage.setItem("user", JSON.stringify(res.data));
      
      if (res.data.role === "specialiste") {
        const tasksRes = await api.get("/specialist/tasks?status=pending");
        setPendingTasks(tasksRes.data.length);
      }
    } catch (err) {
      console.error("Erreur chargement user", err);
      // Ne pas rediriger ici, laisser DashboardLayout gérer
    }
  };
  
  // Vérifier d'abord si on a déjà un user en cache
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    setUser(JSON.parse(storedUser));
  }
  
  fetchUser();
}, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
    if (onThemeChange) onThemeChange(theme);
  }, [theme, onThemeChange]);

  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));
  const handleLogout = async () => {
    await logout();
    if (onLogout) onLogout(); // appeler le callback si fourni
    navigate("/auth/login");
  };
  const handleNavigate = (path) => {
    navigate(path);
    if (isMobileOrTablet) setIsMobileOpen(false);
  };

  if (!user) return null;

  // Fonction pour gérer les items avec sous-menu pour admin
  const renderAdminMenuItem = (item, index, isCollapsed) => {
    if (user.role === "admin" && item.title === "Tableau de Bord" && item.hasSubmenu) {
      if (isMobileOrTablet || isCollapsed) {
        // Version simple pour mobile/tablette ou sidebar réduite
        return (
          <div
            key={item.path}
            onClick={() => {
                  navigate("/adminDashboard");
                  setAdminDashboardOpen(false);
                }}
            className={cn(
              "flex items-center px-3 py-2 rounded-lg cursor-pointer transition",
              location.pathname === "/adminDashboard"
                ? "bg-teal-50 dark:bg-teal-900/30 text-teal-500"
                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && (
             <>
            <span className="ml-3 text-sm font-medium">{item.title}</span>
            {item.badge && (
              <Badge
                variant={item.badge === "Nouveau" ? "default" : "secondary"}
                className="ml-auto text-xs"
              >
                {item.badge}
              </Badge>
            )}
            </>
            )}
          </div>
        );
      }

      // Version desktop avec sous-menu
      return (
        <div key={index}>
          <div
            className={cn(
              "flex items-center px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer",
              "hover:bg-teal-50 hover:text-teal-400 dark:hover:bg-teal-900/20 dark:hover:text-teal-400",
              (location.pathname === "/adminDashboard" || location.pathname === "/dashboardF")
                ? "bg-teal-50 text-teal-400 border-l-4 border-teal-500 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-400" 
                : "text-gray-600 dark:text-gray-300"
            )}
            onClick={() => setAdminDashboardOpen(!adminDashboardOpen)}
          >
            <item.icon className={cn(
              "h-5 w-5 flex-shrink-0",
              (location.pathname === "/adminDashboard" || location.pathname === "/dashboardF")
                ? "text-teal-400 dark:text-teal-400" 
                : "text-gray-500 dark:text-gray-400 group-hover:text-teal-400 dark:group-hover:text-teal-400"
            )} />
            {!collapsed && (
            <span className="ml-3 font-medium text-sm flex-1 truncate">{item.title}</span>
            )}
            {adminDashboardOpen ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
          
          {/* Sous-menu */}
          {adminDashboardOpen && (
            <div className="ml-10 mt-1 space-y-1 border-l border-gray-200 dark:border-gray-700 pl-3">
              <div
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ml-4",
                  "hover:bg-teal-50 hover:text-teal-400 dark:hover:bg-teal-900/20",
                  location.pathname === "/adminDashboard"
                    ? "bg-teal-50 text-teal-400 dark:bg-teal-900/30 dark:text-teal-400"
                    : "text-gray-600 dark:text-gray-300"
                )}
                onClick={() => {
                  navigate("/adminDashboard");
                  setAdminDashboardOpen(false);
                }}
              >
                <Shield className="h-4 w-4 mr-2" />
                {!collapsed && (
                <span className="text-sm">Admin</span>
                )}
              </div>
              <div
                className={cn(
                  "flex items-center px-4 py-2 rounded-lg cursor-pointer transition-all duration-200 ml-4",
                  "hover:bg-teal-50 hover:text-teal-400 dark:hover:bg-teal-900/20",
                  location.pathname === "/dashboardF"
                    ? "bg-teal-50 text-teal-400 dark:bg-teal-900/30 dark:text-teal-400"
                    : "text-gray-600 dark:text-gray-300"
                )}
                onClick={() => { 
                  navigate("/dashboardF")
                  setAdminDashboardOpen(false); // Fermer le menu après clic
                }}
              >
                <Store className="h-4 w-4 mr-2" />
                {!collapsed && (
                <span className="text-sm">Fournisseur</span>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Pour les autres items
    return (
      <div
        key={item.path}
        className={cn(
          "flex items-center px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer",
          "hover:bg-teal-50 hover:text-teal-400 dark:hover:bg-teal-900/20 dark:hover:text-teal-400",
          location.pathname === item.path 
            ? "bg-teal-50 text-teal-400 border-l-4 border-teal-500 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-400" 
            : "text-gray-600 dark:text-gray-300"
        )}
        onClick={() => navigate(item.path)}
      >
        <item.icon className={cn(
          "h-5 w-5 flex-shrink-0",
          location.pathname === item.path 
            ? "text-teal-400 dark:text-teal-400" 
            : "text-gray-500 dark:text-gray-400 group-hover:text-teal-400 dark:group-hover:text-teal-400"
        )} />

        {!collapsed && (
          <>
            <span className="ml-3 font-medium text-sm flex-1 truncate">{item.title}</span>
            {item.badge && (
              <Badge
                variant={item.badge === "Nouveau" ? "default" : "secondary"}
                className="text-xs text-teal-400 px-2 bg-white border-teal-400 py-0.5 h-5 flex-shrink-0"
              >
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </div>
    );
  };

  const items = (menuItems[user.role] || []).map((item) =>
    item.title === "Mes Tâches" && pendingTasks > 0
      ? { ...item, badge: pendingTasks.toString() }
      : item
  );

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin": return <Shield className="h-4 w-4" />;
      case "vendeur": return <Store className="h-4 w-4" />;
      case "fournisseur": return <Package className="h-4 w-4" />;
      case "specialiste": return <Target className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };
  const getRoleName = role => {
    switch(role) {
      case 'admin': return 'Administrateur';
      case 'vendeur': return 'Vendeur';
      case 'fournisseur': return 'Fournisseur';
      case 'specialiste': return 'Spécialiste';
      default: return 'Utilisateur';
    }
  };

  // ====================== VERSION MOBILE & TABLETTE ======================
  if (isMobileOrTablet) {
   return (
     <>
      {/* Overlay mobile & tablette */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity",
          isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Sidebar principal */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-white dark:bg-gray-900 border-r dark:border-gray-800 flex flex-col transition-all duration-300 z-50",
          "w-72", // Largeur fixe pour mobile & tablette
          isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="font-bold text-teal-500">Nexa</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(false)}
            className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronLeft />
          </Button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {items.map((item, index) => {
            if (user.role === "admin" && item.title === "Tableau de Bord" && item.hasSubmenu) {
              return (
                <div key={index}>
                  <div
                    className={cn(
                      "flex items-center px-3 py-2 rounded-lg cursor-pointer transition",
                      "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                    )}
                    onClick={() => setAdminDashboardOpen(!adminDashboardOpen)}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="ml-3 text-sm font-medium">{item.title}</span>
                    {adminDashboardOpen ? (
                      <ChevronUp className="h-4 w-4 ml-auto" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-auto" />
                    )}
                  </div>
                  
                  {/* Sous-menu pour mobile */}
                  {adminDashboardOpen && (
                    <div className="ml-6 mt-1 space-y-1 border-l border-gray-200 dark:border-gray-700 pl-3">
                      <div
                        className={cn(
                          "flex items-center px-3 py-2 rounded-lg cursor-pointer",
                          location.pathname === "/adminDashboard"
                            ? "bg-teal-50 dark:bg-teal-900/30 text-teal-500"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                        )}
                        onClick={() => {
                          handleNavigate("/adminDashboard");
                          setAdminDashboardOpen(false); // Fermer le menu après clic
                        }}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        <span className="text-sm">Admin</span>
                      </div>
                      <div
                        className={cn(
                          "flex items-center px-3 py-2 rounded-lg cursor-pointer",
                          location.pathname === "/dashboardF"
                            ? "bg-teal-50 dark:bg-teal-900/30 text-teal-500"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                        )}
                        onClick={() => { 
                          handleNavigate("/dashboardF")
                          setAdminDashboardOpen(false); // Fermer le menu après clic
                        }}
                      >
                        <Store className="h-4 w-4 mr-2" />
                        <span className="text-sm">Fournisseur</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <div
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg cursor-pointer transition",
                  location.pathname === item.path
                    ? "bg-teal-50 dark:bg-teal-900/30 text-teal-500"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="ml-3 text-sm font-medium">{item.title}</span>
                {item.badge && (
                  <Badge
                    variant={item.badge === "Nouveau" ? "default" : "secondary"}
                    className="ml-auto text-xs"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center mb-3">
            <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-1">
              <LogOut className="h-4 w-4" /> Déconnexion
            </Button>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            <div className="flex items-center justify-center mb-2">
              <img 
                src={logo} 
                alt="XTRA Corporation Logo" 
                className="w-8 h-8 object-contain"
              />
              <span className="font-medium text-teal-400 dark:text-teal-400">Nexa</span>
            </div>
            <p>© 2025 Tous droits réservés</p>
          </div>
        </div>
      </aside>
    </>
   );
  }

  // ====================== VERSION DESKTOP SEULEMENT ======================
  return (
    <div className={cn(
      "flex flex-col min-h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 sticky top-0 h-screen",
      collapsed ? "w-20" : "w-64"
    )}>
      {/* Header avatar */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center relative">
        <div className="relative mb-2">
          <div className={cn(
            "rounded-full overflow-hidden shadow-lg transition-all duration-300",
            collapsed ? "w-12 h-12" : "w-16 h-16"
          )}>
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.nom}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={cn(
                "bg-gradient-to-br bg-black flex items-center justify-center text-white font-bold",
                collapsed ? "text-lg w-full h-full" : "text-xl w-full h-full"
              )}>
                {user.nom ? user.nom.charAt(0).toUpperCase() : "U"}
              </div>
            )}
          </div>
        </div>

        {!collapsed && (
          <div className="text-center">
            <div className="flex dark:text-teal-400 items-center justify-center space-x-2">
              {getRoleIcon(user.role)}
              <h2 className="font-semibold text-lg text-gray-800 dark:text-white">{user.nom}</h2>
            </div>
            <div className="flex items-center justify-center mt-1">
              <p className="text-sm text-teal-400 dark:text-teal-400 font-medium">{getRoleName(user.role)}</p>
            </div>
          </div>
        )}

        {/* Bouton réduire/agrandir */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-4 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors",
            collapsed ? "right-3" : "right-4"
          )}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? 
            <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" /> : 
            <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          }
        </Button>
      </div>

      {/* Menu navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1">
          {items.map((item, index) => renderAdminMenuItem(item, index, collapsed))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/10 mt-auto shadow-inner">
        {user && (
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              {!collapsed ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 ml-4 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                  onClick={handleLogout}
                  title="Déconnexion"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        <div className={`text-gray-500 dark:text-gray-400 text-center ${user.role == 'admin' ? '' : "mt-4"} flex flex-col items-center`}>
          {!collapsed ? (
            <>
              <div className={`flex items-center justify-center ${user.role == 'admin' ? '' : "mb-2"}`}>
                <img 
                  src={logo} 
                  alt="XTRA Corporation Logo" 
                  className="w-10 h-10 object-contain"
                />
                <span className="text-md font-medium text-teal-400 dark:text-teal-400">Nexa</span>
              </div>
              <p className="text-xs">© 2025 Tous droits réservés</p>
            </>
          ) : (
            <img 
              src={logo} 
              alt="XTRA Corporation Logo" 
              className="w-8 h-8 object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
}