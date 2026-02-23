import { useState, useEffect } from "react";
import {
  Eye, EyeOff, Check, Facebook, Instagram, User, MapPin, Lock, Globe, CheckCircle,
  TrendingUp,
  BookOpen,
  LifeBuoy,
  Package,
  Clock,
  X
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import {Layout} from "./HomePage";
import api from "./api";

interface SignUpProps {
  onSwitchToLogin?: () => void;
}

const FeatureCard = ({ icon, title, value, color }) => (
  <div className={`p-4 rounded-xl ${color} border border-gray-100`}>
    <div className="flex items-center mb-2">
      {icon}
      <p className="text-xs font-medium text-gray-500 ml-2 uppercase tracking-wider">{title}</p>
    </div>
    <p className="font-semibold text-gray-800 text-lg">{value}</p>
  </div>
);

export default function SignUp({ onSwitchToLogin }: SignUpProps) {
  const [userType, setUserType] = useState<"vendor" | "supplier">("vendor");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("free");
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get("code") || "";
  const [packs, setPacks] = useState([]);
  const [packInfoModal, setPackInfoModal] = useState({ isOpen: false, pack: null });
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    mot_de_passe: "",
    confirmer_mot_de_passe: "",
    gouvernorat: "",
    ville: "",
    adresse: "",
    facebook_url: "",
    instagram_url: "",
    pack_cle: "",
    code_parrainage: codeFromUrl,
    identifiant_public: "",
  });

  const [parrainage, setParrainage] = useState({ code: "", lien: "" });

  useEffect(() => {
    async function fetchPacks() {
      try {
        const res = await api.get("/packs");
        const data = await res.data;
        setPacks(data);
      } catch (err) {
        console.error("Erreur récupération packs :", err);
        toast.error("Impossible de récupérer les packs ❌");
      }
    }
    fetchPacks();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    try {
      let payload: any = { ...formData };
      let endpoint;

      if (userType === "vendor") {
        payload.pack_cle = selectedPlan;
        payload.role = "vendeur";
        endpoint = "/auth/register-vendeur";
      } else {
        payload.role = "fournisseur";
        endpoint = "/auth/register-fournisseur";
      }

      const response = await api.post(endpoint, payload);

      const data = await response.data;

      if (!response.data) {
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: data.message || "Erreur lors de l'inscription ❌",
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Inscription réussie ✅",
        text: data.message || "Vérifiez votre email pour l'activation",
        confirmButtonColor: "#3085d6",
      });

      if (data.code_parrainage) {
        setParrainage({
          code: data.code_parrainage,
          lien: data.lien_parrainage,
        });
      }

      // Reset du formulaire
      setFormData({
        nom: "",
        email: "",
        telephone: "",
        mot_de_passe: "",
        confirmer_mot_de_passe: "",
        gouvernorat: "",
        ville: "",
        adresse: "",
        facebook_url: "",
        instagram_url: "",
        pack_cle: "",
        code_parrainage: codeFromUrl,
        identifiant_public: "",
      });

    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Erreur serveur, réessayez plus tard ❌",
      });
    }
  };

  const handlePlanSelect = (planId: string) => {
      setSelectedPlan(planId);
    };
  const openPackInfo = (pack) => {
  setPackInfoModal({
    isOpen: true,
    pack: pack
  });
};
  
  const closePackInfo = () => {
    setPackInfoModal({
      isOpen: false,
      pack: null
    });
  };

  return (
    <Layout forceNavbarBackground={true}>
      <div className="py-32 pb-20 container mx-auto px-4 sm:px-6 flex flex-col items-center justify-center min-h-screen animate-in fade-in zoom-in-95 duration-500">
        {/* Background effects avec plus d'espace */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-8 w-80 h-80 sm:w-96 sm:h-96 bg-theme-secondary/10 rounded-full blur-[128px]"></div>
          <div className="absolute bottom-16 left-8 w-80 h-80 sm:w-96 sm:h-96 bg-theme-primary/10 rounded-full blur-[128px]"></div>
        </div>

        <div className="max-w-4xl w-full relative z-10">
          {/* Header avec plus d'espace */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6">Créer Votre Compte</h1>
            <p className="text-lg sm:text-xl text-theme-muted max-w-2xl mx-auto px-4">
              {userType === "vendor" 
                ? "Rejoignez l'élite du e-commerce" 
                : "Devenez partenaire fournisseur"
              }
            </p>
          </div>

          {/* Toggle Type avec plus de padding */}
          <div className="flex justify-center mb-12">
            <div className="bg-theme-muted p-2 rounded-2xl border border-theme inline-flex">
              <button
                onClick={() => setUserType("vendor")}
                className={`py-4 px-10 rounded-xl text-sm font-bold transition-all duration-300 ${
                  userType === "vendor" 
                    ? "bg-pink-600 text-white shadow-lg" 
                    : "text-theme-muted hover:text-theme-white"
                }`}
              >
                Devenir Vendeur
              </button>
              <button
                onClick={() => setUserType("supplier")}
                className={`py-4 px-10 rounded-xl text-sm font-bold transition-all duration-300 ${
                  userType === "supplier" 
                    ? "bg-pink-600 text-white shadow-lg" 
                    : "text-theme-muted hover:text-theme-white"
                }`}
              >
                Devenir Fournisseur
              </button>
            </div>
          </div>

          {/* Formulaire avec plus d'espacement */}
          <form onSubmit={handleSubmitForm} className="space-y-10">
            {/* Informations Personnelles */}
            <Card className="p-8 mb-4 sm:p-10 bg-theme-card">
              <h3 className="text-xl sm:text-2xl font-bold  mb-6 flex items-center">
                <User className="mr-3 text-theme-accent" size={24}/> Informations Personnelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-4">
                  <Label htmlFor="nom">Nom complet <span className="text-red-500">*</span></Label>
                  <Input 
                    id="nom"
                    type="text" 
                    placeholder="Votre nom" 
                    value={formData.nom}
                    onChange={(e) => handleInputChange("nom", e.target.value)}
                    required 
                    className="py-3"
                  />
                </div>
                <div className="space-y-4">
                  <Label htmlFor="telephone">Téléphone <span className="text-red-500">*</span></Label>
                  <Input 
                    id="telephone"
                    type="tel" 
                    placeholder="Numéro de téléphone" 
                    value={formData.telephone}
                    onChange={(e) => handleInputChange("telephone", e.target.value)}
                    required 
                    className="py-3"
                  />
                </div>
                <div className="md:col-span-2 space-y-4">
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="email@exemple.com" 
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required 
                    className="py-3"
                  />
                </div>
              </div>
            </Card>

            {/* Localisation */}
            <Card className="p-8 mb-4 sm:p-10 bg-theme-card">
              <h3 className="text-xl sm:text-2xl font-bold mb-8 flex items-center">
                <MapPin className="mr-3 text-theme-accent" size={24}/> Localisation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-4">
                  <Label htmlFor="gouvernorat">Gouvernorat <span className="text-red-500">*</span></Label>
                  <select
                    id="gouvernorat"
                    value={formData.gouvernorat}
                    onChange={(e) => handleInputChange("gouvernorat", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-input text-theme-muted appearance-none cursor-pointer"
                    required
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="Tunis">Tunis</option>
                    <option value="Ariana">Ariana</option>
                    <option value="Ben Arous">Ben Arous</option>
                    <option value="Manouba">Manouba</option>
                    <option value="Nabeul">Nabeul</option>
                    <option value="Zaghouan">Zaghouan</option>
                    <option value="Bizerte">Bizerte</option>
                    <option value="Béja">Béja</option>
                    <option value="Jendouba">Jendouba</option>
                    <option value="Kef">Kef</option>
                    <option value="Siliana">Siliana</option>
                    <option value="Sousse">Sousse</option>
                    <option value="Monastir">Monastir</option>
                    <option value="Mahdia">Mahdia</option>
                    <option value="Sfax">Sfax</option>
                    <option value="Kairouan">Kairouan</option>
                    <option value="Kasserine">Kasserine</option>
                    <option value="Sidi Bouzid">Sidi Bouzid</option>
                    <option value="Gabès">Gabès</option>
                    <option value="Medenine">Medenine</option>
                    <option value="Tataouine">Tataouine</option>
                    <option value="Gafsa">Gafsa</option>
                    <option value="Tozeur">Tozeur</option>
                    <option value="Kebili">Kebili</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <Label htmlFor="ville">Ville <span className="text-red-500">*</span></Label>
                  <Input 
                    id="ville"
                    type="text" 
                    placeholder="Votre ville" 
                    value={formData.ville}
                    onChange={(e) => handleInputChange("ville", e.target.value)}
                    required 
                    className="py-3"
                  />
                </div>
                <div className="md:col-span-2 space-y-4">
                  <Label htmlFor="adresse">Adresse complète <span className="text-red-500">*</span></Label>
                  <Input 
                    id="adresse"
                    type="text" 
                    placeholder="Rue, Code Postal..." 
                    value={formData.adresse}
                    onChange={(e) => handleInputChange("adresse", e.target.value)}
                    required 
                    className="py-3"
                  />
                </div>
              </div>
            </Card>

            {/* Sécurité */}
            <Card className="p-8 mb-4 sm:p-10 bg-theme-card">
              <h3 className="text-xl sm:text-2xl font-bold mb-8 flex items-center">
                <Lock className="mr-3 text-theme-accent" size={24}/> Sécurité
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-4">
                  <Label htmlFor="mot_de_passe">Mot de passe <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input 
                      id="mot_de_passe"
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={formData.mot_de_passe}
                      onChange={(e) => handleInputChange("mot_de_passe", e.target.value)}
                      required 
                      className="py-3 pr-12"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-white p-2"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <Label htmlFor="confirmer_mot_de_passe">Confirmer <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input 
                      id="confirmer_mot_de_passe"
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={formData.confirmer_mot_de_passe}
                      onChange={(e) => handleInputChange("confirmer_mot_de_passe", e.target.value)}
                      required 
                      className="py-3 pr-12"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-white p-2"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Champs Spécifiques */}
            <Card className="p-8 mb-4 sm:p-10 bg-theme-card">
              <h3 className="text-xl sm:text-2xl font-bold mb-6 flex items-center">
                <Globe className="mr-3 text-theme-accent" size={24}/> Réseaux & Parrainage
              </h3>
              <div className="grid grid-cols-1 gap-6 md:gap-8">
                <div className="space-y-4">
                  <Label htmlFor="facebook_url" className="flex items-center">
                    <Facebook className="w-5 h-5 mr-3 text-blue-500"/> Lien Facebook
                  </Label>
                  <Input 
                    id="facebook_url"
                    type="url" 
                    placeholder="https://facebook.com/..." 
                    value={formData.facebook_url}
                    onChange={(e) => handleInputChange("facebook_url", e.target.value)}
                    className="py-3"
                  />
                </div>
                <div className="space-y-4">
                  <Label htmlFor="instagram_url" className="flex items-center">
                    <Instagram className="w-5 h-5 mr-3 text-pink-500"/> Lien Instagram
                  </Label>
                  <Input 
                    id="instagram_url"
                    type="url" 
                    placeholder="https://instagram.com/..." 
                    value={formData.instagram_url}
                    onChange={(e) => handleInputChange("instagram_url", e.target.value)}
                    className="py-3"
                  />
                </div>
                
                {userType === "vendor" && (
                  <div className="space-y-4">
                    <Label htmlFor="code_parrainage">Code Parrainage (Optionnel)</Label>
                    <Input 
                      id="code_parrainage"
                      type="text" 
                      placeholder="Entrez un code" 
                      value={formData.code_parrainage}
                      onChange={(e) => handleInputChange("code_parrainage", e.target.value)}
                      className="py-3"
                    />
                  </div>
                )}
                
                {userType === "supplier" && (
                  <div className="space-y-4">
                    <Label htmlFor="identifiant_public">Identifiant Public <span className="text-red-500">*</span></Label>
                    <Input 
                      id="identifiant_public"
                      type="text" 
                      placeholder="Nom de votre entreprise" 
                      value={formData.identifiant_public}
                      onChange={(e) => handleInputChange("identifiant_public", e.target.value)}
                      required 
                      className="py-3"
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* Sélection du Pack */}
            {userType === "vendor" && (
              <div className="space-y-8">
                <h3 className="text-xl sm:text-2xl font-bold text-center">Choisissez votre Pack de Démarrage</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {packs.map((pack) => (
                    <div 
                      key={pack.id}
                      onClick={() => handlePlanSelect(pack.cle)}
                      className={`cursor-pointer p-6 sm:p-8 rounded-2xl border-2 transition-all duration-300 ${
                        selectedPlan === pack.cle 
                          ? "bg-theme-primary/20 border-pink-600 ring-1 ring-theme-accent shadow-[0_0_30px_rgba(124,58,237,0.4)] transform scale-105" 
                          : "bg-theme-card border-theme hover:border-theme-white/40 hover:shadow-lg"
                      }`}
                    >

                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-bold  text-lg sm:text-xl">{pack.titre}</h4>
                        {selectedPlan === pack.cle && <CheckCircle className="text-pink-600 h-7 w-7 flex-shrink-0"/>}
                      </div>
                      <p className="text-2xl sm:text-3xl font-black mb-3">{pack.prix} DT</p>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <p className="text-sm sm:text-base text-theme-muted leading-relaxed flex-1">
                          {pack.description}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openPackInfo(pack);
                          }}
                          className="text-sm text-theme-accent hover:text-pink-600 font-medium 
                                     underline transition-colors duration-200 flex-shrink-0
                                     whitespace-nowrap ml-3"
                        >
                          info
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bouton de soumission avec plus d'espace */}
            <div className="pt-6">
              <Button type="submit" className="w-full bg-transparent border-2 border-theme-accent text-theme-accent hover:bg-theme-secondary hover:text-white py-6 text-lg font-bold shadow-[0_0_25px_-8px_rgba(6,182,212,0.4)] transition-all duration-300">
                Créer un Compte
              </Button>
            </div>
          </form>

          {/* Section parrainage après inscription avec plus d'espace */}
          {parrainage.code && (
            <Card className="p-8 mt-12 bg-theme-card border-2 border-green-500/30">
              <h3 className="text-xl font-bold text-pink-600 mb-6 flex items-center">
                <CheckCircle className="h-6 w-6 mr-3" />
                Votre code de parrainage 🎉
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold mb-2">Code :</p>
                  <code className="font-mono bg-theme-muted px-4 py-3 rounded-lg text-lg block text-center">{parrainage.code}</code>
                </div>
                <div>
                  <p className="font-semibold mb-2">Lien :</p>
                  <a
                    href={parrainage.lien}
                    target="_blank"
                    rel="noreferrer"
                    className="text-theme-accent underline hover:text-theme-primary text-lg break-all block text-center"
                  >
                    {parrainage.lien}
                  </a>
                </div>
              </div>
            </Card>
          )}
          
          {/* Lien de connexion avec plus d'espace */}
          <div className="mt-12 text-center text-base text-theme-muted pb-8">
            Vous avez déjà un compte ?{' '}
            <button 
              onClick={() => navigate('/auth/login')} 
              className="text-theme-accent font-bold hover:underline text-lg"
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>
      {packInfoModal.isOpen && packInfoModal.pack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          {/* Conteneur modal avec design plus élégant */}
          <div className="relative max-w-lg  bg-white from-theme-card to-theme-secondary border border-theme-white/20 rounded-2xl shadow-2xl shadow-theme-accent/20 transform animate-in slide-in-from-bottom-10 duration-500">
            
            {/* Header avec fond dégradé */}
            <div className="p-6 pb-4 bg-gradient-to-r from-theme-primary/20 to-theme-accent/10 border-b border-theme-white/10 rounded-t-2xl">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-theme-accent/20 text-theme-accent text-xs font-bold mb-2">
                    PACK
                  </div>
                  <h2 className="text-2xl font-bold ">{packInfoModal.pack.titre}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-3xl font-black text-pink-600">{packInfoModal.pack.prix} DT</span>
                    {packInfoModal.pack.duree_validite && (
                      <span className="text-sm text-theme-muted">/ {packInfoModal.pack.duree_validite}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={closePackInfo}
                  className="text-theme-muted hover:text-theme-white hover:bg-theme-white/10 p-2 rounded-full transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {/* Corps de la modale */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-theme-accent" />
                  <h3 className="font-bold text-lg text-theme-accent">Description</h3>
                </div>
                <p className="text-theme-muted leading-relaxed">{packInfoModal.pack.description}</p>
              </div>
      
              {/* Caractéristiques principales */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-theme-accent" />
                  <h3 className="font-bold text-lg text-theme-accent">Caractéristiques</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {/* Durée */}
                  <div className="bg-theme/50 p-3 rounded-xl border border-theme-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-medium ">Durée</span>
                    </div>
                    <p className="text-theme-muted font-bold">{packInfoModal.pack.duree_validite || "À vie"}</p>
                  </div>
      
                  {/* Produits max */}
                  <div className="bg-theme/50 p-3 rounded-xl border border-theme-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-pink-600" />
                      <span className="text-sm font-medium text-pink-600">Produits</span>
                    </div>
                    <p className="text-theme-muted font-bold">
                      {packInfoModal.pack.nombre_produits === 0 || !packInfoModal.pack.nombre_produits 
                        ? "Illimité" 
                        : `${packInfoModal.pack.nombre_produits}`}
                    </p>
                  </div>
      
                  {/* Support */}
                  <div className="bg-theme/50 p-3 rounded-xl border border-theme-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <LifeBuoy className="h-4 w-4 text-purple-400" />
                      <span className="text-sm font-medium ">Support</span>
                    </div>
                    <p className="text-theme-muted font-bold">{packInfoModal.pack.support || "24/7"}</p>
                  </div>
      
                  {/* Popularité (si disponible) */}
                  {packInfoModal.pack.popularite && (
                    <div className="bg-theme/50 p-3 rounded-xl border border-theme-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm font-medium text-theme-white">Popularité</span>
                      </div>
                      <p className="text-theme-white font-bold">{packInfoModal.pack.popularite}</p>
                    </div>
                  )}
                </div>
              </div>
      
              {/* Avantages */}
              {packInfoModal.pack.avantages && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <h3 className="font-bold text-lg text-theme-white">Avantages inclus</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {packInfoModal.pack.avantages.split(',').map((avantage, index) => (
                      <div 
                        key={index} 
                        className="flex items-start gap-2 p-3 bg-theme/30 rounded-lg border border-theme-white/5 hover:border-theme-accent/30 transition-all duration-200"
                      >
                        <Check className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-theme-muted">{avantage.trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
      
              {/* Note importante */}
              <div className="bg-gradient-to-r from-blue-500/10 to-theme-accent/10 p-4 rounded-xl border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <LifeBuoy className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-300 font-medium">
                      Tous les packs incluent notre support premium et mises à jour régulières.
                    </p>
                    <p className="text-xs text-blue-400/70 mt-1">
                      Annulation possible à tout moment
                    </p>
                  </div>
                </div>
              </div>
            </div>
      
            {/* Footer avec boutons améliorés */}
            <div className="p-6 pt-4 border-t border-theme-white/10 bg-gradient-to-t from-theme-secondary to-transparent rounded-b-2xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    handlePlanSelect(packInfoModal.pack.cle);
                    closePackInfo();
                    toast.success(`Pack "${packInfoModal.pack.titre}" sélectionné ✅`);
                  }}
                  className="flex-1 py-4 px-6 bg-gradient-to-r border border-theme-accent text-theme-accent font-bold rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-pink-500/25 flex items-center justify-center gap-2 group"
                >
                  <CheckCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  Sélectionner ce pack
                </button>
                <button
                  onClick={closePackInfo}
                  className="py-4 px-6 bg-theme/50 text-theme-muted font-bold rounded-xl border border-theme-white/20 hover:bg-theme-white/10 hover:text-theme-white hover:border-theme-white/40 transition-all duration-300"
                >
                  Comparer les autres
                </button>
              </div>
              <p className="text-center text-xs text-theme-muted mt-4">
                Cliquez en dehors de la fenêtre pour fermer
              </p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}