import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const SousCommande = sequelize.define("SousCommande", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING, unique: true, allowNull: false },
  id_commande: { type: DataTypes.INTEGER, allowNull: false },
  id_fournisseur: { type: DataTypes.INTEGER, allowNull: false },
  statut: { 
    type: DataTypes.ENUM(
      "en_attente",
      "emballage_en_cours",
      "annulee",
      "Tentative de confirmation 1",
      "Tentative de confirmation 2",
      "Tentative de confirmation 3",
      "Tentative de confirmation 4",
      "Tentative de confirmation 5",
      "en_attente_enlevement",
      "Colis enlevé",
      "Problème d'enlèvement",
      "Réception_dépôt",
      "en_cours_livraison",
      "Problème de livraison",
      "livree",
      "Livrée payée",
      "À retourner",
      "Colis retourné",
      "Retournée payée",
      "Non disponible"
    ), 
    defaultValue: "en_attente" 
  },
  total: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 }
}, {
  tableName: "sous_commandes",
  timestamps: true,
  createdAt: "cree_le",
  updatedAt: "modifie_le",
});


export default SousCommande;