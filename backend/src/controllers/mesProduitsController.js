// controllers/mesProduitsController.js
import MesProduit from "../models/MesProduit.js";
import Produit from "../models/Produit.js";
import Media from "../models/Media.js";
import Variation from "../models/Variation.js";
import Categorie from "../models/Categorie.js";
import Fournisseur from "../models/Fournisseur.js";
import User from "../models/User.js";

export const getMesProduits = async (req, res) => {
  try {
    const id_vendeur = req.user.id;

    const mesProduits = await MesProduit.findAll({
      where: { id_vendeur },
      include: [
        { 
          model: Produit, 
          required: true, 
          attributes: ["id", "nom", "description", "prix_gros", "id_fournisseur", "stock"],
          include: [
            { 
              model: Categorie, 
              as: "categorie",
              attributes: ["id", "nom"]
            }
          ]
        }
      ],
      order: [["cree_le", "DESC"]],
    });

    const produitIds = mesProduits.map(mp => mp.Produit.id);

    // Récupérer toutes les relations en parallèle
    const [medias, variations, fournisseurs] = await Promise.all([
      Media.findAll({
        where: { id_produit: produitIds },
        attributes: ["id", "url", "type", "id_produit"],
      }),
      Variation.findAll({
        where: { id_produit: produitIds },
        attributes: ["id", "prix_gros", "stock", "id_produit"],
      }),
      // Récupérer les fournisseurs sans doublons
      Fournisseur.findAll({
        where: { 
          id_user: [...new Set(mesProduits.map(mp => mp.Produit.id_fournisseur).filter(id => id))]
        },
        include: [{ 
          model: User, 
          as: "user", 
          attributes: ["id", "nom", "email"] 
        }]
      })
    ]);

    const result = mesProduits.map(mp => {
      const mesProduitData = mp.toJSON();
      const produit = mesProduitData.Produit;
      
      produit.medias = medias.filter(m => m.id_produit === produit.id);
      produit.variations = variations.filter(v => v.id_produit === produit.id);
      
      // Trouver le fournisseur correspondant
      const fournisseur = fournisseurs.find(f => f.id_user === produit.id_fournisseur);
      produit.fournisseur = fournisseur ? fournisseur.toJSON() : null;
      
      return mesProduitData;
    });

    console.log('Mes produits chargés:', result.length);
    res.json(result);

  } catch (err) {
    console.error("Erreur getMesProduits:", err);
    res.status(500).json({ error: err.message });
  }
};
export const addProduit = async (req, res) => {
  try {
    const id_vendeur = req.user.id;
    const { id_produit } = req.params;

    await MesProduit.findOrCreate({
      where: { id_vendeur, id_produit }
    });

    res.json({ message: "Produit ajouté à mes produits" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const removeProduit = async (req, res) => {
  try {
    const id_vendeur = req.user.id;
    const { id_produit } = req.params;

    await MesProduit.destroy({
      where: { id_vendeur, id_produit }
    });

    res.json({ message: "Produit retiré de mes produits" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
