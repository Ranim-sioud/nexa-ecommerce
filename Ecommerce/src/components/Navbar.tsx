import { useEffect, useRef, useState } from "react";
import {
  Search,
  Bell,
  ShoppingCart,
  ChevronLeft,
  Globe,
  User,
  UserPlus,
  Menu,
  X,
  ChevronDown,
  Settings as SettingsIcon,
  Coins,
  Wallet
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useProducts } from "./ProductContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { SidebarTrigger } from "./ui/sidebar";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../context/LanguageContext";
import logo from '../assets/logo.png';
import { logout } from './utils/auth';
import api from "./api";

// Utilitaire pour combiner les classes CSS
const cn = (...classes: (string | undefined | boolean)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface NavbarProps {
  onCartClick: () => void;
  activeSection: string;
  onAuthClick?: () => void;
  onMenuClick?: () => void; // Nouvelle prop
  user?: any;
}

interface INotification {
  id: number;
  id_user: number;
  id_produit: number; // Important pour la redirection
  message: string;
  cree_le: string;
  vu: boolean; // (Optionnel, mais utile)
}

export function Navbar({ onCartClick, activeSection, onAuthClick,onMenuClick, user }: NavbarProps) {
  const { setSearchQuery, getCartItemCount } = useProducts();
  const [searchValue, setSearchValue] = useState("");
  const [currentUser, setCurrentUser] = useState<{ nom: string; email: string; role?: string } | null>(null);
  const cartItemCount = typeof getCartItemCount === "function" ? getCartItemCount() : 0;
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [solde, setSolde] = useState<number>(0.00);
  const [notifications, setNotifications] = useState([]);
  const [openNotif, setOpenNotif] = useState(false);

const { t } = useTranslation();
const { language, changeLanguage } = useLanguage();
const fetchNotifications = async () => {
  try {
    const res = await api.get("/notifications");

    const serverNotifs = res.data;

    // ⭐ Fusion correcte : on conserve le statut lu côté frontend
    setNotifications(prev => {
      return serverNotifs.map(n => {
        const old = prev.find(p => p.id === n.id);
        return old ? { ...n, vu: old.vu } : n; // garder l’ancienne valeur
      });
    });

  } catch (err) {
    console.error("Erreur notifications:", err);
  }
};

const clearBadge = () => {
  setNotifications(prev =>
    prev.map(n => ({ ...n, vu: true }))
  );

  try {
    api.put("/notifications/mark-all-read");
  } catch (err) {
    console.error("Erreur mark all read:", err);
  }
};

useEffect(() => {
  fetchNotifications();
  const timer = setInterval(fetchNotifications, 10000); // refresh toutes les 10 sec
  return () => clearInterval(timer);
}, []);

const handleNotificationClick = (notification: INotification) => {
    if (notification.id_produit) {
      // Redirige vers la page du produit.
      // ⚠️ Ajustez ce chemin si votre route de détail produit est différente !
      navigate(`/products/${notification.id_produit}`);
    }
    setOpenNotif(false); // Fermer le dropdown
  };

  // ⭐ NOUVELLE FONCTION : Gérer le clic sur "Voir tout"
  const handleViewAllClick = () => {
    navigate('/notifications'); // Redirige vers la nouvelle page
    setOpenNotif(false); // Fermer le dropdown
  };

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    } else {
      const raw = localStorage.getItem("user");
      if (raw) {
        try {
          setCurrentUser(JSON.parse(raw));
        } catch {
          setCurrentUser({ nom: "Utilisateur", email: "inconnu@exemple" });
        }
      } else {
        setCurrentUser({ nom: "Utilisateur", email: "inconnu@exemple" });
      }
    }
  }, [user]);

  useEffect(() => {
  const fetchSolde = async () => {
    try {
      const response = await api.get("/users/utilisateur/solde");

      setSolde(parseFloat(response.data.solde));
    } catch (error) {
      console.error("Erreur récupération solde:", error);
    }
  };

  fetchSolde();
}, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof setSearchQuery === "function") setSearchQuery(searchValue);
  };
  

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border shadow-sm">
      <div className="flex h-16 items-center px-4 gap-4">
        <div
            className="lg:hidden p-2 rounded-full"
            onClick={onMenuClick}
          >
            <SidebarTrigger className="h-5 w-5" />
          </div>
        
        {/* Logo and Brand */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center ">
            <img 
              src={logo} 
              alt="XTRA Corporation Logo" 
              className="w-12 h-12 object-contain"
            />
            <h1 className="font-bold text-lg bg-gradient-to-r  bg-clip-text text-teal-400">
              Nexa
            </h1>
          </div>
        </div>


        <div className="flex-1" />

        {/* Action Icons */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
            {/* L'icône de pièces */}
            <Wallet className="w-4 h-4 text-gray-700" strokeWidth={2.5} />
            
            {/* Le texte du solde */}
            <span className="font-bold text-sm text-gray-700">
              {solde.toFixed(2)} TND
            </span>
          </div>

          <Select defaultValue="fr" value={language} onValueChange={(lang) => changeLanguage(lang)}>
            <SelectTrigger className="w-16 h-8 border-0 bg-muted/50 rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">
                <div className="flex items-center space-x-2">
                  <Globe className="h-3 w-3" />
                  <span>FR</span>
                </div>
              </SelectItem>
              <SelectItem value="en">EN</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <button
              onClick={() => {
                setOpenNotif(!openNotif);
                clearBadge(); // 👈 supprimer le badge au clic
              }}
              className="relative p-2 rounded-full hover:bg-gray-100"
            >
              <Bell className="h-4 w-4" />
            
              {/* Badge disparaît automatiquement car notifications.length reste > 0
                  mais toutes sont lu = true */}
              {notifications.some(n => !n.vu) && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 px-1 py-0 h-5 w-5 text-xs flex items-center justify-center"
                >
                  {notifications.filter(n => !n.vu).length}
                </Badge>
              )}
            </button>
          
            {openNotif && (
              <div className="absolute right-0 mt-3 w-96 bg-white shadow-lg border rounded-lg z-50 p-4 max-h-96 overflow-auto">
          
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-lg">{t("notifications")}</h3>
                  <button 
                    className="text-sm text-teal-400"
                    onClick={handleViewAllClick} // 👈 Gérer le clic
                  >
                    {t("viewAll")}
                  </button>
                </div>
          
                {notifications.map((n) => (
                  <div key={n.id} className="flex gap-3 p-3 border-b hover:bg-gray-50" onClick={() => handleNotificationClick(n)}>
                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-teal-600" />
                    </div>
          
                    <div>
                      <p className="text-sm">{n.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(n.cree_le).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
          
              </div>
            )}
          </div>

          {!currentUser && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onAuthClick} 
              className="p-2 rounded-full hover:bg-teal-50 hover:text-teal-400" 
              title="Inscription / Connexion"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          )}

          {/* User Menu */}
          {currentUser && (
            <UserMenu user={currentUser} onSettings={() => navigate("/settings")} onLogout={logout} />
          )}
        </div>
      </div>

      {/* Mobile Search Bar */}
      {activeSection === "marketplace" && (
        <div className={cn("md:hidden px-4 pb-4", isMobileMenuOpen ? "block" : "hidden")}>
          <form onSubmit={handleSearch} className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                type="search" 
                placeholder="Rechercher un produit..." 
                value={searchValue} 
                onChange={(e) => setSearchValue(e.target.value)} 
                className="pl-10 rounded-full" 
              />
            </div>
            <Button 
              type="submit" 
              size="sm" 
              className="bg-gradient-to-r from-teal-400 to-teal-600 hover:from-teal-400 hover:to-teal-700 text-white rounded-full shadow-sm"
            >
              Rechercher
            </Button>
          </form>
        </div>
      )}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* UserMenu : simple dropdown contrôlé par l'app (no Radix)            */
/* ------------------------------------------------------------------ */
function UserMenu({
  user,
  onSettings,
  onLogout,
}: {
  user: { nom: string; email: string; role?: string } | null;
  onSettings: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleLogoutClick = async () => {
    await logout();
    setOpen(false); // fermer le menu
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        type="button"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-teal-600 to-teal-400 rounded-full flex items-center justify-center">
          <span className="text-white font-medium text-xs">
            {user?.nom ? user.nom.charAt(0).toUpperCase() : "U"}
          </span>
        </div>
        <span className="text-sm text-muted-foreground hidden md:block">{user?.nom ?? "Utilisateur"}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
      </button>

      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-56 z-50 rounded-lg border bg-white text-gray-900 shadow-lg dark:bg-gray-800 dark:text-white dark:border-gray-700 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p className="text-sm font-medium">{user?.nom ?? "Utilisateur"}</p>
            <p className="text-xs text-muted-foreground">{user?.email ?? "email@exemple"}</p>
            {user?.role && (
              <div className="mt-1">
                <Badge variant="outline" className="text-xs">
                  {user.role}
                </Badge>
              </div>
            )}
          </div>
          <div className="p-2">
            <button
              onClick={() => {
                setOpen(false);
                onSettings();
              }}
              className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
            >
              <SettingsIcon className="h-4 w-4 mr-2" />
              {t("Paramètres")}
            </button>
            <button
              onClick={handleLogoutClick}
              className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center text-red-600 dark:text-red-400"
            >
              <X className="h-4 w-4 mr-2" />
              {t("logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}