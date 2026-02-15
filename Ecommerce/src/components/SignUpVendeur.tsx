import React, { useState } from 'react';
import { Globe, Facebook, Instagram, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { PackSelection } from './PackSelection';

interface VendorRegistrationProps {
  onBack: () => void;
  onSupplierRegistration?: () => void;
}

const tunisianGovernorates = [
  'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan', 'Bizerte',
  'Béja', 'Jendouba', 'Le Kef', 'Siliana', 'Kairouan', 'Kasserine', 'Sidi Bouzid',
  'Sousse', 'Monastir', 'Mahdia', 'Sfax', 'Gafsa', 'Tozeur', 'Kebili',
  'Gabès', 'Medenine', 'Tataouine'
];

export function SignUpVendeur({ onBack, onSupplierRegistration }: VendorRegistrationProps) {
  const [activeTab, setActiveTab] = useState('vendor');
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    email: '',
    governorate: '',
    city: '',
    address: '',
    password: '',
    confirmPassword: '',
    facebookPage: '',
    instagramPage: ''
  });
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.number.trim()) newErrors.number = 'Le numéro est requis';
    if (!formData.email.trim()) newErrors.email = 'L\'adresse e-mail est requise';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Adresse e-mail invalide';
    if (!formData.governorate) newErrors.governorate = 'Le gouvernorat est requis';
    if (!formData.city.trim()) newErrors.city = 'La ville est requise';
    if (!formData.address.trim()) newErrors.address = 'L\'adresse est requise';
    if (!formData.password) newErrors.password = 'Le mot de passe est requis';
    else if (formData.password.length < 8) newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!selectedPack) {
      alert('Veuillez sélectionner un pack');
      return;
    }

    // Here you would typically submit the form to your backend
    console.log('Form submitted:', { formData, selectedPack });
    alert('Inscription soumise avec succès!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header Navigation */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="text-xl tracking-wide">
                <span className="text-cyan-400">ecom</span>
                <span className="text-white">ness</span>
              </div>
              <nav className="hidden md:flex space-x-6">
                <a href="#" className="text-gray-300 hover:text-white transition-colors">Accueil</a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">Formation</a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">Plateforme</a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">Témoignages</a>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Globe className="w-4 h-4" />
                <span>FR</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-900"
              >
                Connexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Tabs */}
          <div className="mb-8">
            <div className="flex justify-center">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-600 rounded-lg p-1 flex">
                <button
                  onClick={() => setActiveTab('vendor')}
                  className={`px-6 py-2 rounded-md text-sm transition-colors ${
                    activeTab === 'vendor'
                      ? 'bg-cyan-500 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Devenir vendeur
                </button>
                <button
                  onClick={() => {
                    setActiveTab('supplier');
                    onSupplierRegistration && onSupplierRegistration();
                  }}
                  className={`px-6 py-2 rounded-md text-sm transition-colors ${
                    activeTab === 'supplier'
                      ? 'bg-cyan-500 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Devenir fournisseur
                </button>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Nom *</Label>
                  <Input
                    id="name"
                    placeholder="Nom "
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`bg-slate-800/50 border-slate-600 text-white placeholder-gray-400 ${
                      errors.name ? 'border-red-500' : 'focus:border-cyan-400'
                    }`}
                  />
                  {errors.name && <p className="text-sm text-red-400">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="number" className="text-white">Numéro *</Label>
                  <Input
                    id="number"
                    placeholder="Numéro"
                    value={formData.number}
                    onChange={(e) => handleInputChange('number', e.target.value)}
                    className={`bg-slate-800/50 border-slate-600 text-white placeholder-gray-400 ${
                      errors.number ? 'border-red-500' : 'focus:border-cyan-400'
                    }`}
                  />
                  {errors.number && <p className="text-sm text-red-400">{errors.number}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Adresse e-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`bg-slate-800/50 border-slate-600 text-white placeholder-gray-400 ${
                      errors.email ? 'border-red-500' : 'focus:border-cyan-400'
                    }`}
                  />
                  {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Mot de passe *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mot de passe"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`bg-slate-800/50 border-slate-600 text-white placeholder-gray-400 ${
                        errors.password ? 'border-red-500' : 'focus:border-cyan-400'
                      }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">Confirmer le mot de passe *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirmer le mot de passe"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`bg-slate-800/50 border-slate-600 text-white placeholder-gray-400 ${
                        errors.confirmPassword ? 'border-red-500' : 'focus:border-cyan-400'
                      }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-red-400">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="governorate" className="text-white">Gouvernorat *</Label>
                  <Select 
                    value={formData.governorate} 
                    onValueChange={(value) => handleInputChange('governorate', value)}
                  >
                    <SelectTrigger 
                      className={`bg-slate-800/50 border-slate-600 text-white ${
                        errors.governorate ? 'border-red-500' : 'focus:border-cyan-400'
                      }`}
                    >
                      <SelectValue placeholder="Sélectionnez un gouvernorat" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {tunisianGovernorates.map((gov) => (
                        <SelectItem key={gov} value={gov} className="text-white hover:bg-slate-700">{gov}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.governorate && <p className="text-sm text-red-400">{errors.governorate}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-white">Ville *</Label>
                  <Input
                    id="city"
                    placeholder="Ville"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={`bg-slate-800/50 border-slate-600 text-white placeholder-gray-400 ${
                      errors.city ? 'border-red-500' : 'focus:border-cyan-400'
                    }`}
                  />
                  {errors.city && <p className="text-sm text-red-400">{errors.city}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-white">Adresse *</Label>
                  <Input
                    id="address"
                    placeholder="Adresse"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className={`bg-slate-800/50 border-slate-600 text-white placeholder-gray-400 ${
                      errors.address ? 'border-red-500' : 'focus:border-cyan-400'
                    }`}
                  />
                  {errors.address && <p className="text-sm text-red-400">{errors.address}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebook" className="text-white flex items-center">
                    <Facebook className="w-4 h-4 mr-2 text-cyan-400" />
                    Lien de la page Facebook
                  </Label>
                  <Input
                    id="facebook"
                    placeholder="Lien de la page Facebook"
                    value={formData.facebookPage}
                    onChange={(e) => handleInputChange('facebookPage', e.target.value)}
                    className="bg-slate-800/50 border-slate-600 text-white placeholder-gray-400 focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram" className="text-white flex items-center">
                    <Instagram className="w-4 h-4 mr-2 text-cyan-400" />
                    Lien de la page Instagram
                  </Label>
                  <Input
                    id="instagram"
                    placeholder="Lien de la page Instagram"
                    value={formData.instagramPage}
                    onChange={(e) => handleInputChange('instagramPage', e.target.value)}
                    className="bg-slate-800/50 border-slate-600 text-white placeholder-gray-400 focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Pack Selection */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl mb-2 text-white">Sélection du pack</h3>
                <p className="text-gray-300">
                  Choisissez le pack qui correspond à vos besoins
                </p>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-600 rounded-lg p-6">
                <PackSelection 
                  selectedPack={selectedPack}
                  onPackSelect={setSelectedPack}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center pt-6">
              <Button 
                type="submit" 
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border-0 px-12 py-3 text-lg rounded-full"
                disabled={!selectedPack}
              >
                Créer un Compte
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Activation Windows Notice */}
      <div className="fixed bottom-6 right-6 bg-slate-800/90 backdrop-blur-sm border border-slate-600 rounded-lg p-4 text-sm text-gray-300 max-w-sm">
        <div className="mb-1">Activer Windows</div>
        <div>Accédez aux paramètres pour activer Windows.</div>
      </div>

      {/* Floating dots decoration */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
      <div className="absolute top-40 right-20 w-1 h-1 bg-white rounded-full animate-pulse delay-300"></div>
      <div className="absolute bottom-20 left-20 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-pulse delay-700"></div>
      <div className="absolute bottom-40 right-10 w-1 h-1 bg-white rounded-full animate-pulse delay-500"></div>
    </div>
  );
}