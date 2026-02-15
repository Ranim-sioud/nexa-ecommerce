import Parrainage from "../models/Parrainage.js";
import User from "../models/User.js";
import Vendeur from "../models/Vendeur.js";
import Pack from "../models/Pack.js";
import Transaction from "../models/Transaction.js";

Vendeur.belongsTo(User, { foreignKey: "id_user" });
Parrainage.belongsTo(User, { as: "parrain", foreignKey: "id_parrain" });
Parrainage.belongsTo(User, { as: "parrained", foreignKey: "id_parrained" });

/**
 * Admin : afficher toutes les relations de parrainage
 */
export const getAllParrainages = async (req, res) => {
  try {
    const parrainages = await Parrainage.findAll({
      include: [
        { model: User, as: "parrain", attributes: {
          include: ["id", "nom", "email"],
          exclude: ["mot_de_passe", "refresh_token"]
        } },
        { model: User, as: "parrained", attributes: {
          include: ["id", "nom", "email"],
          exclude: ["mot_de_passe", "refresh_token"]
        } },
      ],
      order: [["cree_le", "DESC"]],
    });

    const parrainagesAvecBonus = await Promise.all(
      parrainages.map(async (p) => {
        // Récupérer toutes les transactions "bonus_parrainage" du parrain
        const transactions = await Transaction.findAll({
          where: {
            id_utilisateur: p.id_parrain,
            type: "bonus_parrainage",
          },
          order: [["cree_le", "DESC"]],
        });

        let bonus = 0;

        for (const t of transactions) {
          // Si meta est une chaîne JSON, on la parse
          const meta = typeof t.meta === "string" ? JSON.parse(t.meta) : t.meta;

          // Vérifie si le bonus concerne ce filleul
          if (meta?.from === p.id_parrained) {
            bonus = t.montant;
            break; // on garde le plus récent trouvé
          }
        }

        return { ...p.toJSON(), bonus };
      })
    );

    res.json(parrainagesAvecBonus);
  } catch (err) {
    console.error("Erreur getAllParrainages:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getBonusParVendeur = async (req, res) => {
  try {
    const vendeurs = await User.findAll({
      where: { role: "vendeur" },
      include: [
        {
          model: Vendeur,
          as: "vendeur",
          attributes: ["pack_cle"],
          required: false,
        },
        {
          model: Transaction,
          as: "transactions",
          where: { type: "bonus_parrainage" },
          required: false,
        },
      ],
      attributes: { exclude: ["mot_de_passe", "refresh_token"] },
    });

    const result = vendeurs.map((v) => {
      const totalBonus =
        v.transactions?.reduce(
          (acc, t) => acc + Number(t.montant || 0),
          0
        ) || 0;

      return {
        id: v.id,
        nom: v.nom,
        email: v.email,
        totalBonus: parseFloat(totalBonus),
        packType: v.vendeur?.pack_cle || "—", // ✅ jointure correcte
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Erreur dans getBonusParVendeur:", error);
    res.status(500).json({ message: "Erreur lors du calcul des bonus" });
  }
};
function getDefaultPourcentage(niveau) {
  if (niveau === 1) return 20;
  if (niveau === 2) return 10;
  return 5; // Pour niveau 3 et supérieurs
}
export const getParrainagesByVendeur = async (req, res) => {
  try {
    console.log('=== DEBUT getParrainagesByVendeur ===');
    const idVendeur = parseInt(req.params.id, 10);
    console.log('ID vendeur reçu:', idVendeur);
    
    if (isNaN(idVendeur)) {
      console.log('ID invalide');
      return res.status(400).json({ message: "ID invalide" });
    }

    // 🔹 Vérifier si l'utilisateur existe
    const userExists = await User.findByPk(idVendeur);
    if (!userExists) {
      console.log('Utilisateur non trouvé:', idVendeur);
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    console.log('Recherche des parrainages pour vendeur:', idVendeur);

    // 🔹 Rechercher tous les parrainages où ce vendeur est parrain
    const parrainages = await Parrainage.findAll({
      where: { id_parrain: idVendeur },
      include: [
        { 
          model: User, 
          as: "parrained", 
          attributes: ["id", "nom", "email"]
        }
      ],
      order: [["cree_le", "DESC"]],
    });

    console.log('Nombre de parrainages trouvés:', parrainages.length);

    // 🔹 Récupérer TOUTES les transactions de bonus pour ce vendeur
    const transactions = await Transaction.findAll({
      where: {
        id_utilisateur: idVendeur,
        type: "bonus_parrainage",
      },
      order: [["cree_le", "DESC"]],
    });

    console.log(`Transactions bonus trouvées: ${transactions.length}`);
    
    // 🔹 Créer un map pour retrouver rapidement le bonus et le pourcentage par filleul
    const infoParFilleul = new Map();
    
    transactions.forEach(transaction => {
      try {
        const meta = typeof transaction.meta === "string" 
          ? JSON.parse(transaction.meta) 
          : transaction.meta;
        
        const fromId = meta?.from || meta?.fromId || meta?.filleulId;
        const niveau = meta?.niveau;
        const pourcentage = meta?.pourcentage; // Récupérer le pourcentage stocké
        
        if (fromId) {
          infoParFilleul.set(fromId, {
            montant: parseFloat(transaction.montant) || 0,
            niveau: niveau,
            pourcentage: pourcentage || getDefaultPourcentage(niveau), // Utiliser le pourcentage stocké ou calculé
            transactionId: transaction.id
          });
          console.log(`Map: filleul ${fromId} -> bonus ${transaction.montant}, niveau ${niveau}, pourcentage ${pourcentage}%`);
        }
      } catch (parseError) {
        console.log(`Erreur parsing meta transaction ${transaction.id}:`, parseError.message);
      }
    });

    // 🔹 Traiter chaque parrainage
    const resultats = await Promise.all(
      parrainages.map(async (p) => {
        console.log(`Traitement parrainage ID ${p.id}, filleul: ${p.id_parrained}`);
        
        // Trouver le parrain DIRECT (niveau 1) de ce filleul
        const parrainDirectRelation = await Parrainage.findOne({
          where: { 
            id_parrained: p.id_parrained,
            niveau: 1 
          },
          include: [
            { 
              model: User, 
              as: "parrain", 
              attributes: ["id", "nom", "email"]
            }
          ]
        });

        // 🔹 Récupérer les infos depuis le map
        const info = infoParFilleul.get(p.id_parrained);
        const bonus = info ? info.montant : 0;
        const pourcentage = info ? info.pourcentage : getDefaultPourcentage(p.niveau);
        
        console.log(`Bonus pour filleul ${p.id_parrained}: ${bonus}, pourcentage: ${pourcentage}%`);

        const result = {
          id: p.id,
          parrained: p.parrained ? {
            id: p.parrained.id,
            nom: p.parrained.nom || "Inconnu",
            email: p.parrained.email || ""
          } : null,
          parrainDirect: parrainDirectRelation?.parrain ? {
            id: parrainDirectRelation.parrain.id,
            nom: parrainDirectRelation.parrain.nom || "Inconnu",
            email: parrainDirectRelation.parrain.email || ""
          } : null,
          niveau: p.niveau || 1,
          bonus: bonus,
          pourcentage: pourcentage, // Ajouter le pourcentage
          cree_le: p.cree_le || new Date(),
        };

        console.log(`Parrainage traité: ${JSON.stringify(result)}`);
        return result;
      })
    );

    console.log('=== FIN getParrainagesByVendeur ===');
    res.json(resultats.filter(r => r.parrained !== null));
    
  } catch (err) {
    console.error("❌ ERREUR CRITIQUE getParrainagesByVendeur:", err);
    console.error("Stack trace:", err.stack);
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};
