import { Link } from "react-router-dom";
import { Headphones } from "lucide-react";

const FloatingSupportButton: React.FC = () => {
  const createTicketPath = "/ticket/create";

  return (
    <div className="fixed bottom-8 right-8 z-50 group flex flex-col items-end">
      {/* Bulle flottante */}
      <div className="mb-2 opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all duration-300 bg-gray-800 text-white text-sm rounded-lg px-3 py-1 shadow-lg">
        Besoin d’aide ?
      </div>

      {/* Bouton rond principal */}
      <Link
        to={createTicketPath}
        className="flex items-center justify-center w-14 h-14 bg-pink-600 text-white rounded-full shadow-lg hover:bg-pink-700 transition-all duration-300"
      >
        <Headphones size={22} />
      </Link>
    </div>
  );
};

export default FloatingSupportButton;