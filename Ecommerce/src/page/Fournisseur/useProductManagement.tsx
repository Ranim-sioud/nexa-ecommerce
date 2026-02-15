import { useState, useEffect } from 'react';
import { Produit, Categorie } from './AddProduct';
import api from '../../components/api';

export const useProductManagement = () => {
    const [produits, setProduits] = useState<Produit[]>([]);
    const [categories, setCategories] = useState<Categorie[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const fetchProduits = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get("/produits");
            setProduits(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Erreur chargement produits :", err);
            setError("Impossible de charger les produits.");
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get("/categories");
            setCategories(res.data);
        } catch (err) {
            console.error("Erreur chargement catégories :", err);
        }
    };

    useEffect(() => {
        fetchProduits();
        fetchCategories();
    }, []);

    const handleSort = (key: string) => {
        setSortConfig(prevConfig => {
            let direction: 'asc' | 'desc' = 'asc';
            if (prevConfig && prevConfig.key === key && prevConfig.direction === 'asc') {
                direction = 'desc';
            }
            return { key, direction };
        });
    };

    return {
        produits,
        setProduits,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        categories,
        sortConfig,
        handleSort,
    };
};