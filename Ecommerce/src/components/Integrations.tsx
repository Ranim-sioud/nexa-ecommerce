import React, { useState } from 'react';
import { Info, Check, Settings, ExternalLink, Book } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';

interface Integration {
  id: string;
  name: string;
  description: string;
  logo: string;
  status: 'inactive' | 'active' | 'pending';
  features: string[];
  buttonText: string;
  hasGuide: boolean;
  badgeText?: string;
}

export default function Integrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'convertly',
      name: 'Convertly',
      description: 'Intégrez avec votre boutique Convertly',
      logo: 'C',
      status: 'inactive',
      features: ['Commandes', 'Produits'],
      buttonText: 'Activer',
      hasGuide: true,
      badgeText: 'Populaire'
    },
    {
      id: 'woocommerce',
      name: 'WooCommerce',
      description: 'Intégrez avec votre boutique Woocommerce',
      logo: 'W',
      status: 'inactive',
      features: ['Commandes', 'Produits'],
      buttonText: 'Activer',
      hasGuide: true,
      badgeText: 'Gratuit'
    },
    {
      id: 'tiktak-pro',
      name: 'Tiktak Pro',
      description: 'Intégrez avec votre boutique Tiktak Pro',
      logo: '★',
      status: 'inactive',
      features: ['Commandes', 'Produits'],
      buttonText: 'Activer',
      hasGuide: true,
      badgeText: 'Bientôt'
    }
  ]);

  const handleToggleIntegration = (integrationId: string) => {
    setIntegrations(prev => prev.map(integration => {
      if (integration.id === integrationId) {
        return {
          ...integration,
          status: integration.status === 'active' ? 'inactive' : 'active'
        };
      }
      return integration;
    }));
  };

  const getStatusColor = (status: string, badgeText?: string) => {
    if (badgeText === 'Bientôt') return 'bg-orange-100 text-orange-700';
    if (status === 'active') return 'bg-green-100 text-green-700';
    if (badgeText === 'Populaire') return 'bg-pink-100 text-pink-700';
    if (badgeText === 'Gratuit') return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-600';
  };

  const getButtonColor = (badgeText?: string) => {
    if (badgeText === 'Populaire') return 'bg-teal-500 hover:bg-teal-600';
    if (badgeText === 'Gratuit') return 'bg-teal-500 hover:bg-teal-600';
    if (badgeText === 'Bientôt') return 'bg-teal-500 hover:bg-teal-600';
    return 'bg-teal-500 hover:bg-teal-600';
  };

  const getLogoBackground = (id: string) => {
    if (id === 'convertly') return 'bg-purple-100 text-purple-600';
    if (id === 'woocommerce') return 'bg-purple-100 text-purple-600';
    if (id === 'tiktak-pro') return 'bg-orange-100 text-orange-600';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>Dashboard</span>
        <span>›</span>
        <span className="text-foreground">Integrations</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-2">Intégrations</h1>
      </div>

      {/* Info Alert */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-2 text-sm">
            <p className="text-teal-800">
              <strong>Intégrer facilement</strong> avec des plateformes de sites web populaires comme Tiktak Pro, Convertly et WooCommerce pour synchroniser facilement votre boutique en ligne.
            </p>
            <div className="space-y-1">
              <p className="text-teal-700">
                <strong>Note :</strong> Toutes les commandes reçues via l'intégration auront le statut En attente de confirmation jusqu'à ce que le vendeur les confirme.
              </p>
              <p className="text-teal-700">
                <strong>Note :</strong> Seules les commandes Convertly contenant des produits ajoutés à partir d'Ecomness via l'intégration seront acceptées.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.id} className="relative overflow-hidden">
            <CardContent className="p-6">
              {/* Badge */}
              {integration.badgeText && (
                <Badge 
                  className={`absolute top-4 right-4 ${getStatusColor(integration.status, integration.badgeText)}`}
                  variant="secondary"
                >
                  {integration.badgeText}
                </Badge>
              )}

              {/* Logo and Name */}
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-12 h-12 ${getLogoBackground(integration.id)} rounded-lg flex items-center justify-center text-xl font-bold`}>
                  {integration.logo}
                </div>
                <div>
                  <h3 className="font-medium">{integration.name}</h3>
                  <p className="text-sm text-muted-foreground">{integration.description}</p>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {integration.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  className={`w-full text-white ${getButtonColor(integration.badgeText)}`}
                  onClick={() => integration.badgeText !== 'Bientôt' && handleToggleIntegration(integration.id)}
                  disabled={integration.badgeText === 'Bientôt'}
                >
                  {integration.status === 'active' ? 'Désactiver' : integration.buttonText}
                </Button>

                {integration.hasGuide && (
                  <Button variant="outline" className="w-full">
                    <Book className="h-4 w-4 mr-2" />
                    Guide
                  </Button>
                )}
              </div>

              {/* Status Indicator (when active) */}
              {integration.status === 'active' && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-700">Intégration active</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Integration Options */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="font-medium">Intégrations personnalisées</h3>
            <p className="text-sm text-muted-foreground">
              Besoin d'une intégration spécifique ? Contactez notre équipe pour discuter des options personnalisées.
            </p>
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Contacter le support
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="font-medium">Documentation API</h3>
            <p className="text-sm text-muted-foreground">
              Développez votre propre intégration en utilisant notre API REST complète.
            </p>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Book className="h-4 w-4 mr-2" />
                Documentation API
              </Button>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Clés API
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}