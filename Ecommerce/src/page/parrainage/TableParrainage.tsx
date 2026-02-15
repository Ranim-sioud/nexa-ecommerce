import React, { useState, useEffect } from "react";
import Pagination from "./Pagination"; 

// ... (votre interface Relation) ...
interface Relation {
  id: number;
  parrain?: { id: number; nom: string; email: string };
  parrainDirect?: { id: number; nom: string; email: string };
  parrained?: { id: number; nom: string; email: string };
  niveau: number;
  cree_le: string;
  bonus: number;
  pourcentage?: number;
}

interface Props {
  data: Relation[];
  title: string;
  role: "admin" | "vendeur";
  currentUserId?: number | null;
}

// ... (Vos helpers LevelBadge et getBonusPercent restent inchangés) ...
const LevelBadge: React.FC<{ niveau: number }> = ({ niveau }) => {
  let colors = "bg-gray-100 text-gray-800";
  if (niveau === 1) colors = "bg-teal-100 text-teal-600";
  if (niveau === 2) colors = "bg-pink-100 text-pink-600";
  if (niveau === 3) colors = "bg-yellow-100 text-yellow-700";
  if (niveau === 4) colors = "bg-purple-100 text-purple-600";
  if (niveau === 5) colors = "bg-blue-100 text-blue-600";
  if (niveau >= 6) colors = "bg-muted";
  return (
    <span
      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colors}`}
    >
      Niveau {niveau}
    </span>
  );
};
const getBonusPercent = (niveau: number, pourcentage?: number) => {
  if (pourcentage !== undefined) {
    return `(${pourcentage}%)`;
  }
  
  // Sinon, utiliser les valeurs par défaut
  if (niveau === 1) return "(20%)";
  if (niveau === 2) return "(10%)";
  // Pour niveau 3+, afficher 5%
  return "(5%)";
};

const ITEMS_PER_PAGE = 10; // J'ai remis 10, 2 était pour vos tests

const TableParrainage: React.FC<Props> = ({ data, title, role, currentUserId }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  // La donnée paginée sera utilisée par les DEUX affichages
  const paginatedData = data.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  // Helper pour afficher une ligne de carte
  const CardRow: React.FC<{ label: string; children: React.ReactNode }> = ({
    label,
    children,
  }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 text-right">{children}</span>
    </div>
  );

  return (
    // CHANGEMENT: On retire 'overflow-hidden' du conteneur principal
    <div className="bg-white shadow-lg rounded-xl">
      <h2 className="text-lg font-bold p-6">{title}</h2>

      {/* ================================================================== */}
      {/* 1. AFFICHAGE PC / TABLETTE (Le tableau que vous avez déjà)         */}
      {/* ================================================================== */}
      {/* CHANGEMENT: Caché sur mobile (hidden), visible sur md et + (md:block) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              {role === "admin" && ( <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parrain</th> )}
              {role === "vendeur" && ( <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parrain direct</th> )}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filleul</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Niveau</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bonus gagné</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((p, i) => {
             const isMe = role === "vendeur" && currentUserId && p.parrainDirect?.id === currentUserId;
             return (
              <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${isMe ? "bg-blue-50 ring-1 ring-blue-300" : "hover:bg-gray-50"}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{startIndex + i + 1}</td>
                {/* ... (Vos <td> restent les mêmes) ... */}
                {role === "admin" && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {p.parrain ? ( <div> <div>{p.parrain.nom}</div> <div className="text-xs text-gray-500">{p.parrain.email}</div> </div> ) : ( "—" )}
                  </td>
                )}
                {role === "vendeur" && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {p.parrainDirect ? ( 
                      <div> 
                        <div>{p.parrainDirect.nom} 
                         {isMe && (
                          <span className="ml-2 text-xs bg-teal-400 text-white px-1 py-0.4 rounded-full">Moi </span> 
                         )} 
                        </div> 
                        
                        <div className="text-xs text-gray-500">{p.parrainDirect.email}</div> 
                      </div> 
                    ) : ( "—" )}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {p.parrained ? ( <div> <div>{p.parrained.nom}</div> <div className="text-xs text-gray-500">{p.parrained.email}</div> </div> ) : ( "—" )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><LevelBadge niveau={p.niveau} /></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.bonus ? `${p.bonus} DT` : "—"}{" "}<span className="text-gray-500 text-xs">{getBonusPercent(p.niveau , p.pourcentage)}</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(p.cree_le).toLocaleDateString()}</td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {/* ================================================================== */}
      {/* 2. NOUVEL AFFICHAGE MOBILE (Une liste de cartes)                  */}
      {/* ================================================================== */}
      {/* CHANGEMENT: Visible sur mobile (block), caché sur md et + (md:hidden) */}
      <div className="block md:hidden">
        <div className="px-4 py-2 space-y-4">
          {paginatedData.map((p) => {
            const isMe = role === "vendeur" && currentUserId && p.parrainDirect?.id === currentUserId;
            return (
            <div key={p.id} className={`p-4 rounded-lg shadow-sm border ${isMe ? "bg-blue-50 border-blue-300" : "bg-gray-50 border-gray-200"}`}>
              
              {/* Info principale (Filleul) */}
              <div className="flex justify-between items-center mb-3">
                <div className="font-bold text-gray-900">
                  {p.parrained ? p.parrained.nom : "N/A"}
                  <div className="text-xs text-gray-500 font-normal">{p.parrained ? p.parrained.email : ""}</div>
                </div>
                <LevelBadge niveau={p.niveau} />
              </div>

              {/* Autres infos */}
              <div className="space-y-1">
                {/* Affiche le parrain pour l'admin */}
                {role === "admin" && p.parrain && (
                  <CardRow label="Parrain">{p.parrain.nom}</CardRow>
                )}
                
                {/* Affiche le parrain direct pour le vendeur */}
                {role === "vendeur" && p.parrainDirect && (
                  <CardRow label="Parrain direct">{p.parrainDirect.nom} 
                  {isMe && (
                   <span className="ml-2 text-xs bg-teal-400 text-white px-1 py-0.4 rounded-full">Moi </span> 
                  )} </CardRow>
                )}

                <CardRow label="Bonus">
                  <span className="font-semibold text-teal-600">
                    {p.bonus ? `${p.bonus} DT` : "—"}
                  </span>
                </CardRow>
                
                <CardRow label="Date">
                  {new Date(p.cree_le).toLocaleDateString()}
                </CardRow>
              </div>
            </div>
          )})}
        </div>
      </div>

      {/* ================================================================== */}
      {/* 3. PAGINATION ET MESSAGE "VIDE" (Restent inchangés)              */}
      {/* ================================================================== */}

      {/* Le message s'affiche si la source 'data' est vide */}
      {data.length === 0 && (
        <p className="text-center text-gray-500 p-6">
          Aucune relation trouvée
        </p>
      )}
      
      {/* La pagination est en dehors des conteneurs responsifs, elle s'affiche toujours */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default TableParrainage;