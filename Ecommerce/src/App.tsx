import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProductProvider } from "./components/ProductContext";
import { DashboardLayout } from "./components/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PageLoader } from "./components/ui/Loader";
import axios from "axios";

axios.defaults.withCredentials = true;

/* ========== Pages publiques ========== */
const HomePage = lazy(() => import("./components/HomePage"));
const PackDetailsPage = lazy(() => import("./components/PackDetailsPage"));
const FAQPage = lazy(() => import("./components/FAQPage"));
const AuthPages = lazy(() => import("./components/AuthPages"));
const SignUp = lazy(() => import("./components/SignUp"));
const Login = lazy(() => import("./components/Login"));
const ForgotPassword = lazy(() => import("./components/ForgotPassword"));
const ResetPassword = lazy(() => import("./components/ResetPassword"));

/* ========== Dashboards ========== */
const Dashboard = lazy(() => import("./components/dashboard/Dashboard"));
const DashboardF = lazy(() =>
  import("./components/dashboard/DashboardF" /* webpackChunkName: "dashboard-f" */)
);

/* ========== Admin ========== */
const AdminDashboard = lazy(() => import("./page/Admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./page/Admin/AdminUsers"));
const AdminSpecialists = lazy(() => import("./page/Admin/AdminSpecialists"));
const AdminPermissions = lazy(() => import("./page/Admin/AdminPermissions"));
const AdminTasks = lazy(() => import("./page/Admin/AdminTasks"));
const AdminParrainagePage = lazy(() => import("./page/parrainage/AdminParrainagePage"));

/* ========== Spécialiste ========== */
const SpecialistDashboard = lazy(() => import("./page/Spécialiste/SpecialistDashboard"));
const SpecialistUsers = lazy(() => import("./page/Spécialiste/SpecialistUsers"));
const SpecialistProducts = lazy(() => import("./page/Spécialiste/SpecialistProducts"));
const SpecialistCreateProduct = lazy(() => import("./page/Spécialiste/SpecialistCreateProduct"));
const SpecialistEditProduct = lazy(() => import("./page/Spécialiste/SpecialistEditProduct"));
const SpecialistTasks = lazy(() => import("./page/Spécialiste/SpecialistTasks"));

/* ========== Vendeur / Produits ========== */
const Products = lazy(() => import("./page/Vendeur/Products"));
const MesProduits = lazy(() => import("./page/Vendeur/MesProduits"));
const ProductDetail = lazy(() => import("./page/Vendeur/ProductDetail"));

/* ========== Tickets ========== */
const TicketsList = lazy(() => import("./page/tickets/TicketsList"));
const CreateTicket = lazy(() => import("./page/tickets/CreateTicket"));
const TicketDetail = lazy(() => import("./page/tickets/TicketDetail"));

/* ========== Commandes ========== */
const CreerCommande = lazy(() => import("./page/Commande/CreerCommande"));
const ListeCommandes = lazy(() => import("./page/Commande/ListeCommandes"));
const CommandeDetails = lazy(() => import("./page/Commande/CommandeDetails"));
const ListeCommandeFournisseur = lazy(() => import("./page/Commande/ListeCommandeFournisseur"));
const CommandeDetailsFournisseur = lazy(() => import("./page/Commande/CommandeDetailsFournisseur"));

/* ========== Retrait ========== */
const Transactions = lazy(() => import("./page/Retrait/Transactions"));
const AdminDemandesRetrait = lazy(() => import("./page/Retrait/AdminDemandesRetrait"));
const HistoriqueTransactions = lazy(() => import("./page/Retrait/HistoriqueTransactions"));

/* ========== Autres ========== */
const PickupPage = lazy(() => import("./page/Fournisseur/PickupPage"));
const VendeurParrainagePage = lazy(() => import("./page/parrainage/VendeurParrainagePage"));
const NotificationsPage = lazy(() => import("./components/NotificationsPage"));
const MyProducts = lazy(() => import("./components/MyProducts"));
const Integrations = lazy(() => import("./components/Integrations"));
const Settings = lazy(() => import("./components/Settings"));
const Shop = lazy(() => import("./components/Shop"));
const ProductList = lazy(() => import("./page/Fournisseur/ProductList"));


export default function App() {
  return (
    <ProductProvider>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Public ──────────────────────────────────────────────── */}
        <Route path="/" element={<HomePage />} />
        <Route path="/pack/:packId" element={<PackDetailsPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/auth/*" element={<AuthPages />} />
        <Route path="/auth/signup" element={<SignUp />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />

        {/* ── Protected (all authenticated) ───────────────────────── */}
        <Route element={<DashboardLayout />}>

          {/* Common — any authenticated role */}
          <Route element={<ProtectedRoute />}>
            <Route path="/shop" element={<Shop />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/marketplace" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/ticket" element={<TicketsList />} />
            <Route path="/ticket/create" element={<CreateTicket />} />
            <Route path="/ticket/:id" element={<TicketDetail />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>

          {/* Admin only */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/adminDashboard" element={<AdminDashboard />} />
            <Route path="/adminUsers" element={<AdminUsers />} />
            <Route path="/admin/specialists" element={<AdminSpecialists />} />
            <Route path="/admin/permissions" element={<AdminPermissions />} />
            <Route path="/admin/tasks" element={<AdminTasks />} />
            <Route path="/AdminParrainage" element={<AdminParrainagePage />} />
            <Route path="/demandeRetrait" element={<AdminDemandesRetrait />} />
            <Route path="/HistoriqueTransactions" element={<HistoriqueTransactions />} />
          </Route>

          {/* Spécialiste (+ admin) */}
          <Route element={<ProtectedRoute roles={['specialiste', 'admin']} />}>
            <Route path="/specialist/dashboard" element={<SpecialistDashboard />} />
            <Route path="/specialist/users" element={<SpecialistUsers />} />
            <Route path="/specialist/products" element={<SpecialistProducts />} />
            <Route path="/specialist/products/new" element={<SpecialistCreateProduct />} />
            <Route path="/specialist/products/edit/:id" element={<SpecialistEditProduct />} />
            <Route path="/specialist/tasks" element={<SpecialistTasks />} />
          </Route>

          {/* Vendeur (+ admin) */}
          <Route element={<ProtectedRoute roles={['vendeur', 'admin']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/CreerCommande" element={<CreerCommande />} />
            <Route path="/ListeCommandes" element={<ListeCommandes />} />
            <Route path="/commande/:id" element={<CommandeDetails />} />
            <Route path="/MesProduits" element={<MesProduits />} />
            <Route path="/products" element={<MyProducts />} />
            <Route path="/VendeurParrainage" element={<VendeurParrainagePage />} />
          </Route>

          {/* Fournisseur (+ admin) */}
          <Route element={<ProtectedRoute roles={['fournisseur', 'admin']} />}>
            <Route path="/dashboardF" element={<DashboardF />} />
            <Route path="/ListeCommandeFournisseur" element={<ListeCommandeFournisseur />} />
            <Route path="/CommandeDetailsFournisseur/:id" element={<CommandeDetailsFournisseur />} />
            <Route path="/pickup" element={<PickupPage />} />
            <Route path="/ProductList" element={<ProductList />} />
          </Route>

          {/* Route unique pour Transactions avec tous les rôles concernés */}
          <Route element={<ProtectedRoute roles={['vendeur', 'fournisseur', 'admin']} />}>
            <Route path="/transaction" element={<Transactions />} />
          </Route>

        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      </Suspense>
    </ProductProvider>
  );
}
 