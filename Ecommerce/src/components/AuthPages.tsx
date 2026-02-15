import { useState } from 'react';
import { ArrowLeft, UserPlus, LogIn } from 'lucide-react';
import { Button } from './ui/button';
import SignUp from './SignUp';
import Login from './Login';

type AuthView = 'menu' | 'signup' | 'login' | 'signupF';

export default function AuthPages() {
  const [currentView, setCurrentView] = useState<AuthView>('menu');

  const handleBackToApp = () => {
    // This would typically navigate back to the main app
    window.location.reload();
  };

  if (currentView === 'signup') {
    return (
      <div className="relative">
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="ghost"
            onClick={() => setCurrentView('menu')}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
        <SignUp onSwitchToLogin={() => setCurrentView('login')} />
      </div>
    );
  }


  if (currentView === 'login') {
    return (
      <div className="relative">
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="ghost"
            onClick={() => setCurrentView('menu')}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
        <Login />
      </div>
    );
  }

  // Menu principal
  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white">
      {/* Header */}
      <div className="bg-[#111827] border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-teal-400">ecomness</h1>
              <nav className="hidden md:flex space-x-6">
                <a href="#" className="text-gray-300 hover:text-white">Accueil</a>
                <a href="#" className="text-gray-300 hover:text-white">Formation</a>
                <a href="#" className="text-gray-300 hover:text-white">Plateforme</a>
                <a href="#" className="text-gray-300 hover:text-white">Témoignages</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300">🇫🇷 FR</span>
              <Button
                variant="ghost"
                onClick={() => setCurrentView('login')}
                className="text-gray-300 hover:text-white"
              >
                Connexion
              </Button>
              <Button
                onClick={() => setCurrentView('signup')}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                Inscription
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={handleBackToApp}
              className="text-white hover:bg-gray-800 mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'application
            </Button>
            
            <h1 className="text-4xl font-bold mb-4">
              Bienvenue sur <span className="text-teal-400">ecomness</span>
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Votre plateforme e-commerce tout-en-un
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md mx-auto">
            <Button
              onClick={() => setCurrentView('signup')}
              className="bg-teal-600 hover:bg-teal-700 text-white p-6 h-auto flex flex-col items-center space-y-3"
            >
              <UserPlus className="h-8 w-8" />
              <div>
                <div className="font-semibold">Créer un compte</div>
                <div className="text-sm opacity-90">Nouveau sur ecomness</div>
              </div>
            </Button>

            <Button
              onClick={() => setCurrentView('login')}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800 p-6 h-auto flex flex-col items-center space-y-3"
            >
              <LogIn className="h-8 w-8" />
              <div>
                <div className="font-semibold">Se connecter</div>
                <div className="text-sm opacity-75">Déjà membre</div>
              </div>
            </Button>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p>
              En continuant, vous acceptez nos{' '}
              <a href="#" className="text-teal-400 hover:underline">
                Conditions d'utilisation
              </a>{' '}
              et notre{' '}
              <a href="#" className="text-teal-400 hover:underline">
                Politique de confidentialité
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}