import React, { useEffect, useState } from "react";
import TableParrainage from "./TableParrainage";
import TableBonusVendeurs from "./TableBonusVendeurs";
import api from "../../components/api";
import { SectionLoader } from "../../components/ui/Loader";

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="p-4 bg-red-100 text-red-700 border border-red-300 rounded-lg">
    <p><strong>Erreur :</strong> {message || "Une erreur est survenue."}</p>
  </div>
);

// --- Composant Principal ---

const AdminParrainagePage: React.FC = () => {
  const [relations, setRelations] = useState([]);
  const [bonusVendeurs, setBonusVendeurs] = useState([]);
  
  // États pour gérer le chargement et les erreurs
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fonction pour charger les données
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // On charge les deux en parallèle pour plus d'efficacité
        const [resRelations, resBonus] = await Promise.all([
          api.get("/parrainages"),
          api.get("/parrainages/bonus-par-vendeur")
        ]);
        
        setRelations(resRelations.data);
        setBonusVendeurs(resBonus.data);
        
      } catch (err: any) {
        console.error("Erreur chargement:", err);
        setError("Impossible de charger les données de parrainage. Veuillez réessayer.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Affichage conditionnel
  const renderContent = () => {
    if (isLoading) {
      return <SectionLoader />;
    }
    
    if (error) {
      return <ErrorMessage message={error} />;
    }

    return (
      // On utilise 'gap' pour espacer les tableaux
      <div className="flex flex-col gap-6">
        <TableParrainage 
          title="Relations de parrainage (Admin)" 
          data={relations} 
          role="admin"
        />
        <TableBonusVendeurs data={bonusVendeurs} />
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Ajout d'un titre de page pour la hiérarchie */}
      <h1 className="text-2xl font-bold mb-6">Gestion des Parrainages</h1>
      {renderContent()}
    </div>
  );
};

export default AdminParrainagePage;