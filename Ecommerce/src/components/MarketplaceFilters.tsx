import React from 'react';
import { useProducts } from './ProductContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

const categories = ['All', 'Electronics', 'Clothing', 'Shoes', 'Accessories', 'Home'];

const filters = [
  { key: 'products', label: 'Produits en vedette', count: 9 },
  { key: 'sort', label: 'Trier les produits par' },
  { key: 'categories', label: 'Catégories' },
  { key: 'stock', label: 'État de Stock' },
  { key: 'colors', label: 'Couleurs' },
  { key: 'suppliers', label: 'Fournisseurs' }
];

export function MarketplaceFilters() {
  const { state, setCategory } = useProducts();

  return (
    <div className="bg-background border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center gap-4">
          {filters.map((filter, index) => (
            <div key={filter.key} className="flex items-center">
              {filter.key === 'categories' ? (
                <Select value={state.selectedCategory} onValueChange={setCategory}>
                  <SelectTrigger className="w-40 h-8 border-muted">
                    <SelectValue placeholder="Catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === 'All' ? 'Toutes' : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : filter.key === 'sort' ? (
                <Select defaultValue="featured">
                  <SelectTrigger className="w-44 h-8 border-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Mis en avant</SelectItem>
                    <SelectItem value="price-low">Prix croissant</SelectItem>
                    <SelectItem value="price-high">Prix décroissant</SelectItem>
                    <SelectItem value="newest">Plus récents</SelectItem>
                    <SelectItem value="rating">Mieux notés</SelectItem>
                  </SelectContent>
                </Select>
              ) : filter.key === 'stock' ? (
                <Select defaultValue="all">
                  <SelectTrigger className="w-36 h-8 border-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="in-stock">En stock</SelectItem>
                    <SelectItem value="out-stock">Rupture</SelectItem>
                  </SelectContent>
                </Select>
              ) : filter.key === 'colors' ? (
                <Select defaultValue="all">
                  <SelectTrigger className="w-32 h-8 border-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="red">Rouge</SelectItem>
                    <SelectItem value="blue">Bleu</SelectItem>
                    <SelectItem value="green">Vert</SelectItem>
                    <SelectItem value="black">Noir</SelectItem>
                    <SelectItem value="white">Blanc</SelectItem>
                  </SelectContent>
                </Select>
              ) : filter.key === 'suppliers' ? (
                <Select defaultValue="all">
                  <SelectTrigger className="w-36 h-8 border-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="supplier1">Fournisseur A</SelectItem>
                    <SelectItem value="supplier2">Fournisseur B</SelectItem>
                    <SelectItem value="supplier3">Fournisseur C</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <button className="flex items-center space-x-2 px-3 py-1.5 text-sm border border-muted rounded-md hover:bg-accent">
                  <span>{filter.label}</span>
                  {filter.count && (
                    <Badge variant="secondary" className="text-xs">
                      {filter.count}
                    </Badge>
                  )}
                </button>
              )}
              
              {index < filters.length - 1 && (
                <div className="w-px h-4 bg-border mx-4 hidden sm:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}