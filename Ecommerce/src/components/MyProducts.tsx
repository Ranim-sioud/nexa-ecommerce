import { useState } from 'react';
import { Search, Filter, Plus, Trash2, Edit3, MoreVertical } from 'lucide-react';
import { useProducts } from './ProductContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface MyProductsProps {
  onProductClick: (product: any) => void;
}

export default function MyProducts() {
  const { state } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Mock data for vendor products with discounts and stock status
  const vendorProducts = state.products.map(product => ({
    ...product,
    code: `ENP-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    supplier: `ENSU-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    stock: Math.floor(Math.random() * 500) + 50,
    isInStock: Math.random() > 0.3,
    discount: Math.random() > 0.4 ? Math.floor(Math.random() * 70) + 10 : 0,
    margin: Math.floor(Math.random() * 50) + 20
  }));

  const filteredProducts = vendorProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-2">Mes Produits</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              i
            </div>
            <div className="text-sm text-blue-800">
              <p>
                Ici, vous trouverez tous les produits qui vous intéressent ou que vous vendez actuellement. Ajoutez des produits à votre liste pour créer des commandes. Vous recevrez des notifications en temps réel sur les mises à jour de stock pour chaque produit. Pour ajouter des produits visitez le{' '}
                <span className="text-blue-600 underline cursor-pointer">Marketplace</span>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="search"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
        <Button className="bg-teal-500 hover:bg-teal-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Commande
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {state.products.map((product) => (
          <Card 
            key={product.id} 
            className="group cursor-pointer transition-all duration-300 hover:shadow-md border border-gray-200 rounded-lg overflow-hidden"
            onClick={() => navigate(`/products/${product.id}`)}
          >
            <CardContent className="p-0">
              <div className="relative aspect-square overflow-hidden">
                {/* Stock Status Badge */}
                <div className="absolute top-2 left-2 z-10">
                  <Badge 
                    className={`text-white rounded-full px-2 py-1 text-xs font-medium ${
                      product.isInStock ? 'bg-teal-500' : 'bg-gray-500'
                    }`}
                  >
                    {product.isInStock ? 'En Stock' : 'Hors Stock'}
                  </Badge>
                </div>

                {/* Discount Badge */}
                {product.discount > 0 && (
                  <div className="absolute top-2 right-2 z-10">
                    <Badge className="bg-pink-500 text-white rounded-full px-2 py-1 text-xs font-medium">
                      -{product.discount}%
                    </Badge>
                  </div>
                )}

                {/* Delete Button */}
                <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!product.discount && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle delete
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="p-3">
                <div className="mb-2">
                  <Badge variant="outline" className="text-xs text-muted-foreground mb-1">
                    {product.category}
                  </Badge>
                  <h3 className="font-medium text-sm line-clamp-2 leading-5">
                    {product.name}
                  </h3>
                </div>

                <div className="text-xs text-muted-foreground space-y-1 mb-3">
                  <div>Code produit: {product.code}</div>
                  <div>Fournisseur: {product.supplier}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-gray-900">
                      {product.price} TND
                    </span>
                    {product.discount > 0 && (
                      <div className="text-xs text-muted-foreground line-through">
                        {Math.round(product.price / (1 - product.discount/100))} TND
                      </div>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center mt-8">
        <div className="text-sm text-muted-foreground">
          Affichage de {filteredProducts.length} produits
        </div>
      </div>
    </div>
  );
}