import React, { useState, useEffect } from "react";
import Pagination from "./Pagination"; 

// ... (votre interface VendeurBonus) ...
interface VendeurBonus {
  id: number;
  nom: string;
  email: string;
  totalBonus: number;
  packType: string;
}

interface Props {
  data: VendeurBonus[];
}

// ... (Votre helper PackBadge reste inchangé) ...
const PackBadge: React.FC<{ type: string }> = ({ type }) => {
  let colors = "bg-gray-100 text-gray-800"; // Défaut
  switch (type.toLowerCase()) {
    case "premium":
      colors = "bg-purple-100 text-purple-800";
      break;
    case "gold":
      colors = "bg-yellow-100 text-yellow-800";
      break;
    case "silver":
      colors = "bg-gray-200 text-gray-700";
      break;
  }
  return (
    <span
      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colors}`}
    >
      {type}
    </span>
  );
};

const ITEMS_PER_PAGE = 10; // J'ai remis 10

const TableBonusVendeurs: React.FC<Props> = ({ data }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = data.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  return (
    // On retire 'overflow-hidden' du conteneur principal
    <div className="bg-white shadow-lg rounded-xl">
      <h2 className="text-lg font-bold p-6">Bonus total par vendeur</h2>

      {/* ================================================================== */}
      {/* 1. AFFICHAGE PC / TABLETTE (Le tableau)                          */}
      {/* ================================================================== */}
      {/* CHANGEMENT: Caché sur mobile (hidden), visible sur md et + (md:block) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pack</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bonus</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((v, i) => (
              <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{startIndex + i + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{v.nom}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{v.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <PackBadge type={v.packType} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-teal-400 font-semibold">
                  {Number(v.totalBonus).toFixed(2)} DT
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================================================================== */}
      {/* 2. NOUVEL AFFICHAGE MOBILE (Une liste de cartes)                  */}
      {/* ================================================================== */}
      {/* CHANGEMENT: Visible sur mobile (block), caché sur md et + (md:hidden) */}
      <div className="block md:hidden">
        <div className="px-4 py-2 space-y-4">
          {paginatedData.map((v) => (
            <div key={v.id} className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
              
              {/* Infos Vendeur + Pack */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-gray-900">{v.nom}</div>
                  <div className="text-xs text-gray-500">{v.email}</div>
                </div>
                <PackBadge type={v.packType} />
              </div>

              {/* Ligne de séparation */}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Total Bonus</span>
                  <span className="text-base font-semibold text-teal-500">
                    {Number(v.totalBonus).toFixed(2)} DT
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* ================================================================== */}
      {/* 3. PAGINATION ET MESSAGE "VIDE" (Restent inchangés)              */}
      {/* ================================================================== */}
      
      {data.length === 0 && (
        <p className="text-center text-gray-500 p-6">
          Aucun bonus trouvé pour les vendeurs
        </p>
      )}

      {/* La pagination s'affiche toujours, peu importe le mode */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default TableBonusVendeurs;