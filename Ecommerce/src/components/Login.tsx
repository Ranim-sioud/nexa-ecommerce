import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { useNavigate } from "react-router-dom";
import {Layout} from "./HomePage";
import Swal from "sweetalert2";
import api from "./api";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    mot_de_passe: "",
  });
  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.mot_de_passe) {
      Swal.fire({
        icon: "warning",
        title: "Champs requis",
        text: "Veuillez remplir tous les champs",
        confirmButtonColor: "#0d9488",
      });
      return;
    }

    try {
      const res = await api.post("/auth/login", formData);

      // Stocker infos user
      localStorage.setItem("user", JSON.stringify(res.data.user));

      Swal.fire({
        icon: "success",
        title: "Connexion réussie !",
        text: "Bienvenue " + res.data.user.nom,
        confirmButtonColor: "#0d9488",
      });

      // Redirection selon le rôle
      if (res.data.user.role === "vendeur") navigate("/dashboard");
      else if (res.data.user.role === "fournisseur") navigate("/dashboardF");
      else if (res.data.user.role === "admin") navigate("/adminDashboard");
      else if (res.data.user.role === "specialiste") navigate("/specialist/dashboard");
      else navigate("/");

    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: err.response.data.message,
          confirmButtonColor: "#dc2626",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Erreur serveur",
          text: "Veuillez réessayer plus tard",
          confirmButtonColor: "#dc2626",
        });
      }
    }
  };

  const handleForgotPassword = () => {
    Swal.fire({
      icon: "info",
      title: "Mot de passe oublié",
      text: "Un email de récupération vous sera envoyé",
      confirmButtonColor: "#0d9488",
    });
  };

  return (
    <Layout forceNavbarBackground={true}>
      <div className="pt-32 pb-20 container mx-auto px-4 sm:px-6 flex flex-col items-center justify-center min-h-screen animate-in fade-in zoom-in-95 duration-500">
        {/* Background effects avec plus d'espace */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-80 h-80 sm:w-96 sm:h-96 bg-theme-primary/10 rounded-full blur-[128px]"></div>
          <div className="absolute bottom-16 right-1/4 w-60 h-60 sm:w-80 sm:h-80 bg-theme-secondary/10 rounded-full blur-[128px]"></div>
        </div>

        <div className="w-full max-w-md sm:max-w-lg relative z-10">
          <Card className="w-full p-8 sm:p-10 bg-theme-card border-theme shadow-2xl relative z-10">
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-black mb-4">Accédez à votre compte</h1>
              <p className="text-lg text-theme-muted">Gérez votre empire e-commerce</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Email */}
              <div className="space-y-4">
                <Label htmlFor="email" className="text-lg">Adresse e-mail <span className="text-red-500">*</span></Label>
                <Input 
                  id="email"
                  type="email" 
                  name="email"
                  placeholder="email@exemple.com" 
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  className="py-3 text-base"
                />
              </div>

              {/* Password */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label htmlFor="mot_de_passe" className="text-lg">Mot de passe <span className="text-red-500">*</span></Label>
                  <button 
                    type="button" 
                    onClick={handleForgotPassword} 
                    className="text-sm text-pink-600 hover:text-theme-white transition-colors font-medium"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <Input 
                    id="mot_de_passe"
                    name="mot_de_passe"
                    type={showPassword ? "text" : "password"} 
                    placeholder="Votre mot de passe" 
                    value={formData.mot_de_passe}
                    onChange={(e) => handleInputChange("mot_de_passe", e.target.value)}
                    className="py-3 pr-12 text-base"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-white p-2"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-transparent border-2 border-theme-accent text-theme-accent hover:bg-theme-accent hover:text-white py-4 text-lg font-bold shadow-[0_0_25px_-8px_rgba(6,182,212,0.4)] transition-all duration-300"
              >
                Connexion
              </Button>
            </form>

            <div className="mt-10 text-center text-base text-theme-muted">
              Pas encore de compte ?{' '}
              <button 
                onClick={() => navigate("/auth/signup")} 
                className="text-theme-accent font-bold hover:underline text-lg"
              >
                Créer un compte
              </button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}