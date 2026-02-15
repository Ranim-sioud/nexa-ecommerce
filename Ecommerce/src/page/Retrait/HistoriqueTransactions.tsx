import { useEffect, useState } from "react";
import api from "../../components/api";

const HistoriqueTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.get("/commande/transactions");
        setTransactions(res.data);
      } catch (error) {
        console.error("Erreur lors du chargement des transactions :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const traduireType = (type: string) => {
    switch (type) {
      case "credit":
        return "Paiement de commande";
      case "debit":
        return "Remboursement commande";
 // garde le texte original pour les nouveaux types
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500 animate-pulse">Chargement des transactions...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-3 text-gray-800">
        Historique des Transactions
      </h2>
      <p className="text-gray-500 mb-6">
        Consultez tous vos mouvements financiers récents : paiements, retraits, remboursements, etc.
      </p>

      <div className="overflow-x-auto rounded-xl shadow-lg bg-white">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="py-3 px-4 text-left">Date</th>
              <th className="py-3 px-4 text-left">Code</th>
              <th className="py-3 px-4 text-left">Type</th>
              <th className="py-3 px-4 text-right">Montant</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-6 text-gray-500">
                  Aucune transaction trouvée
                </td>
              </tr>
            ) : (
              transactions.map((t: any) => (
                <tr
                  key={t.id}
                  className="border-b hover:bg-gray-50 transition duration-150 ease-in-out"
                >
                  <td className="py-3 px-4">
                    {new Date(t.cree_le || t.createdAt).toLocaleString("fr-FR")}
                  </td>
                  <td className="py-3 px-4 font-mono text-sm">{t.code_transaction}</td>
                  <td className="py-3 px-4 text-gray-700">{traduireType(t.type)}</td>
                  <td
                    className={`py-3 px-4 text-right font-semibold ${
                      traduireType(t.type) === "Paiement de commande"? "text-teal-400" : "text-pink-600"
                    }`}
                  >
                    {traduireType(t.type) === "Paiement de commande"
                      ? `+${t.montant} TND`
                      : `-${t.montant} TND`}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoriqueTransactions;