import sequelize from "./config/database.js";
import User from "./models/User.js";
import TicketsType from "./models/TicketsType.js";
import argon2 from 'argon2';

async function seed() {
  try {
    const isProd = process.env.NODE_ENV === "production";

    if (!isProd) {
      await sequelize.sync({ force: true });
    } // ⚠️ reset la DB

    // Hash password commun
    const passwordHash = await argon2.hash("password123", { type: argon2.argon2id });

    // Valeurs par défaut pour les spécialistes
    const defaultVille = "N/A";
    const defaultGouvernorat = "N/A";
    const defaultAdresse = "N/A";

    // ✅ Création des spécialistes
    const it = await User.create({
      nom: "Spécialiste IT",
      email: "it@gmail.com",
      telephone: "20000001",
      mot_de_passe: passwordHash,
      role: "specialiste",
      ville: defaultVille,
      gouvernorat: defaultGouvernorat,
      adresse: defaultAdresse,
    });

    const logistique = await User.create({
      nom: "Spécialiste Logistique",
      email: "logistique@gmail.com",
      telephone: "20000002",
      mot_de_passe: passwordHash,
      role: "specialiste",
      ville: defaultVille,
      gouvernorat: defaultGouvernorat,
      adresse: defaultAdresse,
    });

    const financier = await User.create({
      nom: "Spécialiste Financier",
      email: "financier@gmail.com",
      telephone: "20000003",
      mot_de_passe: passwordHash,
      role: "specialiste",
      ville: defaultVille,
      gouvernorat: defaultGouvernorat,
      adresse: defaultAdresse,
    });

    const compte = await User.create({
      nom: "Spécialiste Comptes",
      email: "compte@gmail.com",
      telephone: "20000004",
      mot_de_passe: passwordHash,
      role: "specialiste",
      ville: defaultVille,
      gouvernorat: defaultGouvernorat,
      adresse: defaultAdresse,
    });

    const formation = await User.create({
      nom: "Spécialiste Formation",
      email: "formation@gmail.com",
      telephone: "20000005",
      mot_de_passe: passwordHash,
      role: "specialiste",
      ville: defaultVille,
      gouvernorat: defaultGouvernorat,
      adresse: defaultAdresse,
    });

    const produit = await User.create({
      nom: "Spécialiste Produits",
      email: "produit@gmail.com",
      telephone: "20000006",
      mot_de_passe: passwordHash,
      role: "specialiste",
      ville: defaultVille,
      gouvernorat: defaultGouvernorat,
      adresse: defaultAdresse,
    });

    const fonctionnalite = await User.create({
      nom: "Spécialiste Fonctionnalités",
      email: "fonctionnalite@gmail.com",
      telephone: "20000007",
      mot_de_passe: passwordHash,
      role: "specialiste",
      ville: defaultVille,
      gouvernorat: defaultGouvernorat,
      adresse: defaultAdresse,
    });

    const confirmationStock = await User.create({
      nom: "Spécialiste Stock",
      email: "stock@gmail.com",
      telephone: "20000008",
      mot_de_passe: passwordHash,
      role: "specialiste",
      ville: defaultVille,
      gouvernorat: defaultGouvernorat,
      adresse: defaultAdresse,
    });

    // ✅ Création de l'admin (pour type Autre)
    let admin = await User.findOne({ where: { role: "admin" } });

    // ✅ Création des types de tickets avec mapping
    await TicketsType.bulkCreate([
      { name: "IT", description: "Support IT",  specialist_user_id: it.id },
      { name: "Logistique", description: "Support Logistique",specialist_user_id: logistique.id },
      { name: "Financier", description: "Support Financier",specialist_user_id: financier.id },
      { name: "Compte", description: "Support Compte",  specialist_user_id: compte.id },
      { name: "Formation", description: "Support Formation", specialist_user_id: formation.id },
      { name: "Produit", description: "Support Produit", specialist_user_id: produit.id },
      { name: "Demande de Fonctionnalité", description: "Support Demande de Fonctionnalité", specialist_user_id: fonctionnalite.id },
      { name: "Confirmation Stock", description: "Support Confirmation Stock", specialist_user_id: confirmationStock.id },
      { name: "Autre", description: "Autre Support", specialist_user_id: admin.id }, // assigné à l'admin
    ]);

    console.log("✅ Spécialistes, admin et types de tickets insérés !");
    process.exit();
  } catch (err) {
    console.error("❌ Erreur seed:", err);
    process.exit(1);
  }
}

seed();