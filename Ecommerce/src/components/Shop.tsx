import React, { useState } from 'react';
import { ShoppingBag, Plus, Store, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';

export default function Shop() {
  const [showLinkShopModal, setShowLinkShopModal] = useState(false);
  const [hasLinkedShop, setHasLinkedShop] = useState(false); // Pour simulation

  const handleLinkShop = () => {
    setShowLinkShopModal(false);
    setHasLinkedShop(true);
    toast.success('Boutique liée avec succès!');
  };

  const handleCreateShop = () => {
    toast.info('Redirection vers la création de boutique...');
  };

  const handleManageIntegrations = () => {
    toast.info('Redirection vers les intégrations...');
  };

  // Si aucune boutique n'est liée
  if (!hasLinkedShop) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-100 rounded-lg">
            <ShoppingBag className="h-6 w-6 text-teal-600" />
          </div>
          <h1 className="text-2xl font-semibold">Ma Boutique</h1>
        </div>

        {/* No Shop Linked State */}
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md text-center">
            <CardContent className="p-8">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-gray-100 rounded-full">
                  <Store className="h-12 w-12 text-gray-400" />
                </div>
              </div>
              
              <h2 className="text-xl font-semibold mb-3">Aucune boutique liée</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Vous n'avez pas d'intégration avec votre boutique en ligne, activez une intégration 
                pour synchroniser vos produits et commandes et accéder à cette page.
              </p>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => setShowLinkShopModal(true)}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Lier Boutique
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleCreateShop}
                  className="w-full"
                >
                  Créer une nouvelle boutique
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Link Shop Modal */}
        <Dialog open={showLinkShopModal} onOpenChange={setShowLinkShopModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="text-center">
              <DialogTitle className="text-xl font-semibold">Lier votre boutique</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-2">
                Connectez votre boutique existante pour synchroniser vos produits et commandes automatiquement.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleLinkShop}
                  className="flex-col h-auto p-4"
                >
                  <div className="p-2 bg-blue-100 rounded-lg mb-2">
                    <ShoppingBag className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-sm">Shopify</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleLinkShop}
                  className="flex-col h-auto p-4"
                >
                  <div className="p-2 bg-orange-100 rounded-lg mb-2">
                    <Store className="h-6 w-6 text-orange-600" />
                  </div>
                  <span className="text-sm">WooCommerce</span>
                </Button>
              </div>
              
              <Button 
                onClick={handleManageIntegrations}
                variant="ghost" 
                className="w-full text-teal-600 hover:text-teal-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Voir toutes les intégrations
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Si une boutique est liée (état après liaison)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-100 rounded-lg">
            <ShoppingBag className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Ma Boutique</h1>
            <p className="text-sm text-muted-foreground">Boutique connectée avec succès</p>
          </div>
        </div>
        
        <Button variant="outline" onClick={() => setHasLinkedShop(false)}>
          Déconnecter (Test)
        </Button>
      </div>

      {/* Shop Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits Synchros</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">143</div>
            <p className="text-xs text-muted-foreground">
              +12 ce mois-ci
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes Auto</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">
              +3 aujourd'hui
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Synchronisation</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">
              Dernière sync il y a 5 min
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="justify-start">
              <Plus className="h-4 w-4 mr-2" />
              Synchroniser produits
            </Button>
            <Button variant="outline" className="justify-start">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Gérer les stocks
            </Button>
            <Button variant="outline" className="justify-start">
              <Store className="h-4 w-4 mr-2" />
              Paramètres boutique
            </Button>
            <Button variant="outline" className="justify-start">
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir la boutique
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle>État de l'intégration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Boutique Shopify</p>
                  <p className="text-sm text-muted-foreground">ma-boutique.myshopify.com</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">Connectée</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}