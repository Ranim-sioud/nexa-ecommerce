import { DemandeRetrait, Vendeur, Fournisseur, Transaction, User } from "../models/index.js";
import sequelize from "../config/database.js";

const MIN_MONTANT = 100.0;

const generateCodeRetrait = () => {
  const date = new Date();
  const yyyymmdd = date.toISOString().slice(0,10).replace(/-/g,'');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RT-${yyyymmdd}-${random}`;
};

/**
 * Créer une demande de retrait
 */
export const createDemande = async (req, res) => {
  const user = req.user;
  const { montant } = req.body;

  if (!montant) return res.status(400).json({ error: "Montant requis" });

  const montantNum = parseFloat(montant);
  if (isNaN(montantNum) || montantNum < MIN_MONTANT)
    return res.status(400).json({
      error: `Le montant doit être >= ${MIN_MONTANT} TND`,
    });

  try {
    // Récupération du compte selon le rôle
    let account =
      user.role === "vendeur"
        ? await Vendeur.findOne({ where: { id_user: user.id } })
        : user.role === "fournisseur"
        ? await Fournisseur.findOne({ where: { id_user: user.id } })
        : null;

    if (!account)
      return res
        .status(404)
        .json({ error: "Compte utilisateur introuvable" });

    const solde = parseFloat(account.solde_portefeuille || 0);
    console.log('solde', solde)
    console.log('montantNum', montantNum)
    if (montantNum > solde)
      return res
        .status(400)
        .json({ error: "Montant supérieur au solde disponible" });

    // ⚠️ On ne déduit PAS encore le solde ici — seulement à l’approbation
    const codeRetrait = generateCodeRetrait();

    await DemandeRetrait.create({
      id_user: user.id,
      code_retrait: codeRetrait,
      montant: montantNum,
      statut: "en_attente",
    });

    return res.json({
      message:
        "Demande de retrait enregistrée avec succès et en attente de validation",
    });
  } catch (err) {
    console.error("Erreur création retrait:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};
/**
 * Lister les demandes de retrait de l'utilisateur connecté
 */
export const listUserDemandes = async (req, res) => {
  const user = req.user;
  try {
    const demandes = await DemandeRetrait.findAll({
      where: { id_user: user.id },
      order: [["cree_le", "DESC"]],
    });
    return res.json({ demandes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * Admin: Lister toutes les demandes
 */
export const listAllDemandes = async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Accès interdit" });

  try {
    const demandes = await DemandeRetrait.findAll({
      order: [["cree_le", "DESC"]],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "nom", "email", "telephone", "role"], // Sélectionnez les champs que vous voulez
          required: false, // LEFT JOIN au lieu de INNER JOIN
        },
      ],
    });
    const demandesFormatees = demandes.map(demande => {
      const demandeJSON = demande.toJSON();
      return {
        ...demandeJSON,
        nom_utilisateur: demandeJSON.user 
          ? `${demandeJSON.user.nom}`.trim()
          : null,
        role: demandeJSON.user.role // Vous pouvez garder ou retirer l'objet user complet
      };
    });
    
    return res.json({ demandes: demandesFormatees });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * Admin: Changer le statut d'une demande
 *  - Si "approuve" → débiter le solde de l'utilisateur
 *  - Si "refuse" → aucun changement
 */
export const updateStatut = async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Accès interdit" });

  const { id } = req.params;
  const { statut } = req.body;

  if (!["approuve", "refuse", "en_attente"].includes(statut))
    return res.status(400).json({ error: "Statut invalide" });

  try {
    const demande = await DemandeRetrait.findByPk(id);
    if (!demande)
      return res
        .status(404)
        .json({ error: "Demande de retrait introuvable" });

    if (demande.statut !== "en_attente")
      return res
        .status(400)
        .json({ error: "Cette demande a déjà été traitée" });

    await sequelize.transaction(async (t) => {
      // Trouver le compte (vendeur ou fournisseur)
      let account = await Vendeur.findOne({
        where: { id_user: demande.id_user },
        transaction: t,
      });
      if (!account)
        account = await Fournisseur.findOne({
          where: { id_user: demande.id_user },
          transaction: t,
        });

      if (!account)
        throw new Error("Compte vendeur/fournisseur introuvable pour ce retrait");

      const solde = parseFloat(account.solde_portefeuille || 0);

      if (statut === "approuve") {
        if (solde < demande.montant)
          throw new Error("Solde insuffisant au moment du paiement");

        // ✅ Débit du solde
        account.solde_portefeuille = (solde - parseFloat(demande.montant)).toFixed(2);
        await account.save({ transaction: t });

        // ✅ Mise à jour du statut de la demande
        demande.statut = "approuve";
        demande.date_paiement = new Date();
        await demande.save({ transaction: t });

        // ✅ Enregistrement de la transaction dans le journal
        await Transaction.create(
          {
            id_utilisateur: demande.id_user,
            type: "debit",
            montant: demande.montant,
            meta: {
              type_operation: "retrait",
              code_retrait: demande.code_retrait,
              description: `Retrait approuvé le ${new Date().toLocaleDateString()}`,
            },
          },
          { transaction: t }
        );

      } else if (statut === "refuse") {
        demande.statut = "refuse";
        await demande.save({ transaction: t });
      }
    });

    return res.json({ message: "Statut mis à jour avec succès" });
  } catch (err) {
    console.error("Erreur updateStatut:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};



// ✅ Suppression d’une demande
export const deleteDemande = async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  try {
    const demande = await DemandeRetrait.findByPk(id);
    if (!demande)
      return res.status(404).json({ error: "Demande introuvable" });

    if (demande.id_user !== user.id)
      return res.status(403).json({ error: "Accès refusé" });

    if (demande.statut !== "en_attente")
      return res
        .status(400)
        .json({
          error: "Seules les demandes en attente peuvent être supprimées",
        });

    await demande.destroy();

    return res.json({
      message: "Demande de retrait supprimée avec succès",
    });
  } catch (err) {
    console.error("Erreur suppression demande:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Exemple basique (à adapter selon ta BDD)
    const transactions = await Transaction.findAll({
      where: { id_utilisateur: userId },
      order: [["cree_le", "DESC"]],
    });

    res.json({ transactions });
  } catch (err) {
    console.error("Erreur getTransactions:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};