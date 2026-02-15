import React, { useState } from "react";
import api from "../../components/api";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  solde: number;
};

const RetraitModal: React.FC<Props> = ({ open, onClose, onSuccess, solde }) => {
  const [montant, setMontant] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const submit = async () => {
    setError(null);
    const montantNum = typeof montant === "string" && montant === "" ? NaN : Number(montant);
    if (isNaN(montantNum)) return setError("Montant invalide");
    if (montantNum < 100) return setError("Le montant doit être au moins 100 TND");
    console.log('solde',solde)
    console.log('montantNum',montantNum)
    if (montantNum > solde) return setError("Montant supérieur au solde disponible");

    try {
      setLoading(true);
      await api.post("/retraits", { montant: montantNum });
      setLoading(false);
      onSuccess && onSuccess();
      onClose();
    } catch (err: any) {
      setLoading(false);
      setError(err?.response?.data?.error || "Erreur serveur");
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2000
    }}>
      <div style={{ width: 640, background: "#fff", borderRadius: 8, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3>Nouvelle Demande de Retrait</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <p>Entrez le montant que vous souhaitez retirer. Le montant doit être entre 100 TND et votre solde actuel.</p>
        <div style={{ marginTop: 12 }}>
          <label>Montant</label>
          <input
            type="number"
            value={montant}
            onChange={e => setMontant(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="Montant"
            style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #222" }}
          />
        </div>
        {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
        <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
          <button onClick={submit} disabled={loading} style={{
            padding: "10px 22px", borderRadius: 8, background: "#061022", color: "#fff", border: "none"
          }}>
            {loading ? "En cours..." : "Sauvegarder"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RetraitModal;