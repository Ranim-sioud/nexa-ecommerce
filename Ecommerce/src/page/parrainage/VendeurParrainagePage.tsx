import React, { useEffect, useState } from "react";
import TableParrainage from "./TableParrainage";
import api from "../../components/api";

interface DecodedToken {
  id: number;
  email: string;
  role: string;
  exp?: number;
}

const VendeurParrainagePage: React.FC = () => {
  const [relations, setRelations] = useState([]);
  const [idVendeur, setIdVendeur] = useState<number | null>(null);

  useEffect(() => {
  api.get("/users/me")
    .then(res => {
      setIdVendeur(res.data.id);
    })
    .catch(err => {
      console.error("Utilisateur non connecté", err);
      setIdVendeur(null);
    });
}, []);

  useEffect(() => {
    if (!idVendeur) return;
    api
      .get(`/parrainages/vendeur/${idVendeur}`)
      .then((res) => setRelations(res.data))
      .catch((err) => console.error("Erreur:", err));
  }, [idVendeur]);
  console.log('relation', relations)
  return (
    <div className="p-6">
      <TableParrainage title="Mes filleuls" data={relations} role="vendeur" currentUserId={idVendeur}/>
    </div>
  );
};

export default VendeurParrainagePage;