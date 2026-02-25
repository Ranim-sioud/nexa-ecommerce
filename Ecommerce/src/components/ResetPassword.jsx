import { useState, useEffect } from "react";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Layout } from "../components/HomePage";
import Swal from "sweetalert2";
import api from "../components/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    nouveau_mot_de_passe: "",
    confirmer_mot_de_passe: "",
  });

  // Vérifier la validité du token au chargement
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsValidToken(false);
        setIsVerifying(false);
        return;
      }

      try {
        await api.get(`/auth/verify-reset-token/${token}`);
        setIsValidToken(true);
      } catch (err) {
        console.error(err);
        setIsValidToken(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Validation du mot de passe en temps réel
  const getPasswordStrength = () => {
    const password = formData.nouveau_mot_de_passe;
    if (!password) return { score: 0, message: "" };

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const isLongEnough = password.length >= 8;

    const checks = [hasUpperCase, hasLowerCase, hasNumbers, isLongEnough];
    const validCount = checks.filter(Boolean).length;

    if (validCount === 4) return { score: 100, message: "Mot de passe fort", color: "text-green-500" };
    if (validCount === 3) return { score: 75, message: "Mot de passe moyen", color: "text-yellow-500" };
    if (validCount === 2) return { score: 50, message: "Mot de passe faible", color: "text-orange-500" };
    return { score: 25, message: "Mot de passe très faible", color: "text-red-500" };
  };

  const passwordStrength = getPasswordStrength();
  const passwordsMatch = formData.nouveau_mot_de_passe === formData.confirmer_mot_de_passe;
  const isPasswordValid = formData.nouveau_mot_de_passe.length >= 8 && 
                         /[A-Z]/.test(formData.nouveau_mot_de_passe) &&
                         /[a-z]/.test(formData.nouveau_mot_de_passe) &&
                         /\d/.test(formData.nouveau_mot_de_passe);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isPasswordValid) {
      Swal.fire({
        icon: "warning",
        title: "Mot de passe invalide",
        text: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre",
        confirmButtonColor: "#0d9488",
      });
      return;
    }

    if (!passwordsMatch) {
      Swal.fire({
        icon: "warning",
        title: "Les mots de passe ne correspondent pas",
        text: "Veuillez vérifier votre saisie",
        confirmButtonColor: "#0d9488",
      });
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/reset-password", {
        token,
        nouveau_mot_de_passe: formData.nouveau_mot_de_passe,
        confirmer_mot_de_passe: formData.confirmer_mot_de_passe,
      });

      setIsSuccess(true);

      Swal.fire({
        icon: "success",
        title: "Mot de passe réinitialisé !",
        text: "Votre mot de passe a été modifié avec succès",
        confirmButtonColor: "#0d9488",
      }).then(() => {
        navigate("/auth/login");
      });

    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: err.response?.data?.message || "Une erreur est survenue",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <Layout forceNavbarBackground={true}>
        <div className="pt-32 pb-20 container mx-auto px-4 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-accent mx-auto mb-4"></div>
            <p className="text-theme-muted">Vérification du lien...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isValidToken) {
    return (
      <Layout forceNavbarBackground={true}>
        <div className="pt-32 pb-20 container mx-auto px-4 flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Lien invalide ou expiré</h2>
            <p className="text-theme-muted mb-6">
              Le lien de réinitialisation n'est plus valide. Veuillez faire une nouvelle demande.
            </p>
            <Link to="/auth/forgot-password">
              <Button className="bg-theme-accent hover:bg-theme-accent/90">
                Nouvelle demande
              </Button>
            </Link>
          </Card>
        </div>
      </Layout>
    );
  }

  if (isSuccess) {
    return (
      <Layout forceNavbarBackground={true}>
        <div className="pt-32 pb-20 container mx-auto px-4 flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Mot de passe modifié !</h2>
            <p className="text-theme-muted mb-6">
              Votre mot de passe a été réinitialisé avec succès.
            </p>
            <Link to="/auth/login">
              <Button className="bg-theme-accent hover:bg-theme-accent/90">
                Se connecter
              </Button>
            </Link>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout forceNavbarBackground={true}>
      <div className="pt-32 pb-20 container mx-auto px-4 sm:px-6 flex flex-col items-center justify-center min-h-screen animate-in fade-in zoom-in-95 duration-500">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-80 h-80 sm:w-96 sm:h-96 bg-theme-primary/10 rounded-full blur-[128px]"></div>
          <div className="absolute bottom-16 right-1/4 w-60 h-60 sm:w-80 sm:h-80 bg-theme-secondary/10 rounded-full blur-[128px]"></div>
        </div>

        <div className="w-full max-w-md sm:max-w-lg relative z-10">
          <Card className="w-full p-8 sm:p-10 bg-theme-card border-theme shadow-2xl relative z-10">
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-black mb-4">Nouveau mot de passe</h1>
              <p className="text-lg text-theme-muted">
                Choisissez un mot de passe sécurisé
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Nouveau mot de passe */}
              <div className="space-y-4">
                <Label htmlFor="nouveau_mot_de_passe" className="text-lg">
                  Nouveau mot de passe <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="nouveau_mot_de_passe"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nouveau mot de passe"
                    value={formData.nouveau_mot_de_passe}
                    onChange={(e) => handleInputChange("nouveau_mot_de_passe", e.target.value)}
                    className="py-3 pr-12 text-base"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-white p-2"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                {/* Barre de force du mot de passe */}
                {formData.nouveau_mot_de_passe && (
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-300"
                        style={{ 
                          width: `${passwordStrength.score}%`,
                          backgroundColor: passwordStrength.score >= 75 ? '#10b981' : 
                                         passwordStrength.score >= 50 ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    </div>
                    <p className={`text-sm ${passwordStrength.color}`}>
                      {passwordStrength.message}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirmer mot de passe */}
              <div className="space-y-4">
                <Label htmlFor="confirmer_mot_de_passe" className="text-lg">
                  Confirmer le mot de passe <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmer_mot_de_passe"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirmer le mot de passe"
                    value={formData.confirmer_mot_de_passe}
                    onChange={(e) => handleInputChange("confirmer_mot_de_passe", e.target.value)}
                    className="py-3 pr-12 text-base"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-white p-2"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                {/* Indicateur de correspondance */}
                {formData.confirmer_mot_de_passe && (
                  <p className={`text-sm ${passwordsMatch ? 'text-green-500' : 'text-red-500'}`}>
                    {passwordsMatch ? '✓ Les mots de passe correspondent' : '✗ Les mots de passe ne correspondent pas'}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !isPasswordValid || !passwordsMatch}
                className="w-full bg-theme-accent hover:bg-theme-accent/90 text-white py-4 text-lg font-bold shadow-[0_0_25px_-8px_rgba(6,182,212,0.4)] transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <Link
                to="/auth/login"
                className="inline-flex items-center gap-2 text-theme-accent hover:underline"
              >
                Retour à la connexion
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}