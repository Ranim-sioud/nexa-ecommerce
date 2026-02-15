import { User, Vendeur, Fournisseur } from "../models/index.js";
import bcrypt from "bcrypt";
import argon2 from "argon2";
import { v2 as cloudinary } from "cloudinary";
import multer, { diskStorage } from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { CloudinaryStorage } from "multer-storage-cloudinary";


// 🔹 Config Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 🔹 Multer + Cloudinary
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads")); // dossier uploads à créer
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
export const upload = multer({ storage });

// Récupérer les infos du compte connecté
export async function getMe(req, res) {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Vendeur,
          as: "vendeur",
          required: false // LEFT JOIN pour inclure même si pas vendeur
        },
        {
          model: Fournisseur,
          as: "fournisseur",
          required: false // LEFT JOIN pour inclure même si pas fournisseur
        }
      ],
      attributes: { exclude: ["mot_de_passe", "refresh_token"] },
    });
    
    if (!user) return res.status(401).json({ message: "Utilisateur non trouvé" });

    // Structure de réponse adaptée aux deux rôles
    const response = {
      id: user.id,
      nom: user.nom,
      email: user.email,
      telephone: user.telephone,
      gouvernorat: user.gouvernorat,
      ville: user.ville,
      adresse: user.adresse,
      rib: user.rib,
      image_url: user.image_url,
      role: user.role,
    };

    // Ajouter les informations spécifiques au rôle
    if (user.role === "vendeur" && user.vendeur) {
      response.nom_boutique = user.vendeur.nom_boutique;
      response.code_parrainage = user.vendeur.code_parrainage;
      response.solde_portefeuille = user.vendeur.solde_portefeuille;
    } 
    else if (user.role === "fournisseur" && user.fournisseur) {
      response.identifiant_public = user.fournisseur.identifiant_public;
      response.solde_portefeuille = user.fournisseur.solde_portefeuille;
    }

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

// Modifier les infos du compte
export async function updateMe(req, res) {
  try {
    const user = req.user;
    const { nom, telephone, gouvernorat, ville, adresse, facebook_url, instagram_url, rib, nom_boutique, mot_de_passe } = req.body;

    if (mot_de_passe) {
      if (mot_de_passe.length < 8) {
        return res.status(400).json({ message: "Le mot de passe doit avoir au moins 8 caractères" });
      }
      user.mot_de_passe = await argon2.hash(mot_de_passe);
    }

    user.nom = nom || user.nom;
    user.telephone = telephone || user.telephone;
    user.gouvernorat = gouvernorat || user.gouvernorat;
    user.ville = ville || user.ville;
    user.adresse = adresse || user.adresse;
    user.facebook_url = facebook_url || user.facebook_url;
    user.instagram_url = instagram_url || user.instagram_url;
    user.rib = rib || user.rib; 

    await user.save();

    if (user.role === "vendeur" && nom_boutique) {
      const vendeur = await Vendeur.findOne({ where: { id_user: user.id } });
      if (vendeur) {
        vendeur.nom_boutique = nom_boutique;
        await vendeur.save();
      }
    }

    res.json({ message: "Compte mis à jour ✅", user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
      } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// 🔹 Route Upload Photo
export async function uploadProfileImage(req, res) {
  try {
    const user = req.user;
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier envoyé" });
    }

    user.image_url = `http://localhost:4001/uploads/${req.file.filename}`;
    await user.save();

    res.json({ message: "Image mise à jour ✅", profileImage: user.image_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

export async function getProfile(req, res) {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["mot_de_passe", "refresh_token"] },
      include: [
        { model: Vendeur, as: "vendeur" },
        { model: Fournisseur, as: "fournisseur" }
      ]
    });

    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    res.json({user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
      }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}


// Mettre à jour profil
export async function updateProfile(req, res) {
  try {
    const { nom, telephone, gouvernorat, ville, adresse, facebook_url, instagram_url,rib, nom_boutique, mot_de_passe } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    // Mettre à jour mot_de_passe si fourni
    if (mot_de_passe) {
      if (mot_de_passe.length < 8) {
        return res.status(400).json({ message: "Mot de passe trop court (min 8 caractères)" });
      }
      user.mot_de_passe = await argon2.hash(mot_de_passe, { type: argon2.argon2id });
    }

    // Mettre à jour autres infos
    user.nom = nom || user.nom;
    user.telephone = telephone || user.telephone;
    user.gouvernorat = gouvernorat || user.gouvernorat;
    user.ville = ville || user.ville;
    user.adresse = adresse || user.adresse;
    user.facebook_url = facebook_url || user.facebook_url;
    user.instagram_url = instagram_url || user.instagram_url;
    user.rib = rib || user.rib;

    await user.save();

    if (user.role === "vendeur" && nom_boutique) {
      const vendeur = await Vendeur.findOne({ where: { id_user: user.id } });
      if (vendeur) {
        vendeur.nom_boutique = nom_boutique;
        await vendeur.save();
      }
    }

    res.json({ message: "Profil mis à jour ✅", user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
      } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

export async function getFournisseurs(req, res) {
  try {
    const fournisseurs = await User.findAll({
      where: { 
        role: 'fournisseur', 
        actif: true 
      },
      attributes:{ include: ['id', 'nom', 'email', 'telephone', 'ville', 'gouvernorat', 'identifiant_public'],  exclude: ["mot_de_passe", "refresh_token"] }
    });
    
    res.json(fournisseurs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

export async function getSoldeVendeur(req, res) {
  try {
    const vendeur = await Vendeur.findOne({ 
      where: { id_user: req.user.id },
      include: [{ model: User, as: "utilisateur" }]
    });
    
    res.json({
      solde: vendeur.solde_portefeuille,
      vendeur: {
        id: vendeur.id_user,
        nom: vendeur.utilisateur.nom
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
}

export const getSoldeUtilisateur = async (req, res) => {
  try {
    const userId = req.user.id; // récupéré depuis le middleware auth
    const userRole = req.user.role; // ex: 'vendeur' ou 'fournisseur'

    let solde = 0;

    if (userRole === "vendeur") {
      const vendeur = await Vendeur.findOne({ where: { id_user: userId } });
      if (!vendeur) {
        return res.status(404).json({ message: "Vendeur introuvable" });
      }
      solde = vendeur.solde_portefeuille;
    } else if (userRole === "fournisseur") {
      const fournisseur = await Fournisseur.findOne({ where: { id_user: userId } });
      if (!fournisseur) {
        return res.status(404).json({ message: "Fournisseur introuvable" });
      }
      solde = fournisseur.solde_portefeuille;
    } else {
      return res.status(400).json({ message: "Rôle utilisateur invalide" });
    }

    return res.json({ solde: Number(solde).toFixed(2) });
  } catch (error) {
    console.error("Erreur récupération solde:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};