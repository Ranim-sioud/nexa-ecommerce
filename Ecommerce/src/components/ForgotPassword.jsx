import { useState } from "react";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import { Layout } from "../components/HomePage";
import Swal from "sweetalert2";
import api from "../components/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      Swal.fire({
        icon: "warning",
        title: "Email requis",
        text: "Veuillez entrer votre adresse email",
        confirmButtonColor: "#0d9488",
      });
      return;
    }

    // Validation email simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Swal.fire({
        icon: "warning",
        title: "Email invalide",
        text: "Veuillez entrer une adresse email valide",
        confirmButtonColor: "#0d9488",
      });
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      setIsSubmitted(true);
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
            {!isSubmitted ? (
              <>
                <div className="text-center mb-10">
                  <h1 className="text-3xl sm:text-4xl font-black mb-4">Mot de passe oublié ?</h1>
                  <p className="text-lg text-theme-muted">
                    Entrez votre email pour recevoir un lien de réinitialisation
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Email */}
                  <div className="space-y-4">
                    <Label htmlFor="email" className="text-lg">
                      Adresse e-mail <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted h-5 w-5" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@exemple.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="py-3 pl-10 text-base"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-theme-accent hover:bg-theme-accent/90 text-white py-4 text-lg font-bold shadow-[0_0_25px_-8px_rgba(6,182,212,0.4)] transition-all duration-300 disabled:opacity-50"
                  >
                    {isLoading ? "Envoi en cours..." : "Envoyer le lien"}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="flex justify-center mb-6">
                  <CheckCircle className="h-20 w-20 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Email envoyé !</h2>
                <p className="text-theme-muted mb-6">
                  Si un compte existe avec l'adresse <strong>{email}</strong>, 
                  vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
                </p>
                <p className="text-sm text-theme-muted mb-8">
                  (Vérifiez également vos spams)
                </p>
              </div>
            )}

            <div className="mt-8 text-center">
              <Link
                to="/auth/login"
                className="inline-flex items-center gap-2 text-theme-accent hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour à la connexion
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}