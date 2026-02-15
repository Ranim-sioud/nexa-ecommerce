import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) {
    return null; // Ne pas afficher la pagination s'il n'y a qu'une page
  }

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    // La pagination est en dehors du scroll du tableau
    <div className="flex items-center justify-between p-4 bg-white border-t border-gray-200 rounded-b-xl">
      {/* Bouton Précédent */}
      <div>
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Précédent
        </button>
      </div>

      {/* Indicateur de page (responsive) */}
      <div className="hidden sm:block text-sm text-gray-700">
        Page <span className="font-medium">{currentPage}</span> sur{" "}
        <span className="font-medium">{totalPages}</span>
      </div>

      {/* Bouton Suivant */}
      <div>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Suivant
        </button>
      </div>
    </div>
  );
};

export default Pagination;