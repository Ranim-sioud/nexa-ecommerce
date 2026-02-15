import React from 'react';
import { Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface Pack {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  features: string[];
  popular?: boolean;
  free?: boolean;
}

interface PackSelectionProps {
  selectedPack: string | null;
  onPackSelect: (packId: string) => void;
}

const packs: Pack[] = [
  {
    id: 'free',
    name: 'PACK FREE',
    price: 0,
    description: '100% Gratuit',
    features: [
      'Création de boutique basique',
      'Jusqu\'à 10 produits',
      'Support par email',
      'Thème de base'
    ],
    free: true
  },
  {
    id: 'damrej',
    name: 'PACK DAMREJ',
    price: 297,
    description: 'Paiement unique',
    features: [
      'Jusqu\'à 50 produits',
      'Thèmes personnalisés',
      'Analytics de base',
      'Support prioritaire',
      'Intégration réseaux sociaux'
    ]
  },
  {
    id: 'ejja',
    name: 'PACK 3EJJA',
    price: 497,
    description: 'Paiement unique',
    features: [
      'Produits illimités',
      'Thèmes premium',
      'Analytics avancés',
      'Support 24/7',
      'SEO optimisé',
      'Multi-langues'
    ],
    popular: true
  },
  {
    id: 'brand',
    name: 'PACK BRAND',
    price: 1997,
    description: 'Paiement unique',
    features: [
      'Tout du Pack 3EJJA',
      'Design personnalisé',
      'Domaine gratuit',
      'Formation complète',
      'Marketing automation',
      'API avancée'
    ]
  },
  {
    id: 'machrou3',
    name: 'PACK MACHROU3',
    price: 3500,
    originalPrice: 4500,
    description: 'Paiement unique',
    features: [
      'Solution entreprise complète',
      'Développement sur mesure',
      'Intégration ERP',
      'Support dédié',
      'Formation équipe',
      'Maintenance incluse 1 an'
    ]
  }
];

export function PackSelection({ selectedPack, onPackSelect }: PackSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl mb-2">Choisissez votre pack</h3>
        <p className="text-muted-foreground">
          Sélectionnez le pack qui correspond le mieux à vos besoins
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packs.map((pack) => (
          <Card 
            key={pack.id}
            className={`relative cursor-pointer transition-all hover:shadow-lg ${
              selectedPack === pack.id 
                ? 'ring-2 ring-primary border-primary' 
                : 'border-border'
            } ${pack.popular ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => onPackSelect(pack.id)}
          >
            {pack.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white">Plus populaire</Badge>
              </div>
            )}
            
            {pack.free && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-green-500 text-white">Gratuit</Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg">{pack.name}</CardTitle>
              <div className="flex items-center justify-center gap-2">
                {pack.originalPrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    {pack.originalPrice} DT
                  </span>
                )}
                <span className="text-3xl">
                  {pack.price === 0 ? '0' : pack.price} DT
                </span>
              </div>
              <CardDescription>{pack.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {pack.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button 
                variant={selectedPack === pack.id ? "default" : "outline"}
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onPackSelect(pack.id);
                }}
              >
                {selectedPack === pack.id ? 'Sélectionné' : 'Choisir ce pack'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Obtenez plus de détails sur nos tarifs et packs</p>
      </div>
    </div>
  );
}