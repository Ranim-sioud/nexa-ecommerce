import sequelize from "../src/config/database.js";
import Fournisseur from "../src/models/Fournisseur.js";
import User from "../src/models/User.js";
import TicketsType from "../src/models/TicketsType.js";
import argon2 from 'argon2';
import dotenv from "dotenv";
dotenv.config();

// Idempotent seed: safe to run multiple times.
// Each entity is created only if it does not already exist (findOrCreate on email/name).
async function seed() {
  try {
    const passwordHash = await argon2.hash("password123", { type: argon2.argon2id });
    const defaults = { ville: "N/A", gouvernorat: "N/A", adresse: "N/A" };

    const specialists = [
      { nom: "Spécialiste IT",              email: "it@gmail.com",             telephone: "20000001" },
      { nom: "Spécialiste Logistique",      email: "logistique@gmail.com",      telephone: "20000002" },
      { nom: "Spécialiste Financier",       email: "financier@gmail.com",       telephone: "20000003" },
      { nom: "Spécialiste Comptes",         email: "compte@gmail.com",          telephone: "20000004" },
      { nom: "Spécialiste Formation",       email: "formation@gmail.com",       telephone: "20000005" },
      { nom: "Spécialiste Produits",        email: "produit@gmail.com",         telephone: "20000006" },
      { nom: "Spécialiste Fonctionnalités", email: "fonctionnalite@gmail.com",  telephone: "20000007" },
      { nom: "Spécialiste Stock",           email: "stock@gmail.com",           telephone: "20000008" },
    ];

    const createdSpecialists = [];
    for (const s of specialists) {
      const [user] = await User.findOrCreate({
        where: { email: s.email },
        defaults: { ...s, mot_de_passe: passwordHash, role: "specialiste", ...defaults },
      });
      createdSpecialists.push(user);
    }

    const [it, logistique, financier, compte, formation, produit, fonctionnalite, confirmationStock] = createdSpecialists;

    // Admin — created from env vars; skipped if already exists
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) throw new Error("ADMIN_EMAIL env var is required for seeding");

    const passwordHashAdmin = await argon2.hash(process.env.ADMIN_PASSWORD, { type: argon2.argon2id });

    const [admin, adminCreated] = await User.findOrCreate({
      where: { email: adminEmail },
      defaults: {
        nom: process.env.ADMIN_NOM,
        email: adminEmail,
        telephone: process.env.ADMIN_TELEPHONE,
        mot_de_passe: passwordHashAdmin,
        role: "admin",
        ville: process.env.ADMIN_VILLE || "N/A",
        gouvernorat: process.env.ADMIN_GOUVERNORAT || "N/A",
        adresse: process.env.ADMIN_ADRESSE || "N/A",
        actif: true,
        validation: true,
      },
    });

    if (adminCreated) {
      const identifiantPublic = `PUB-${admin.id}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      await Fournisseur.findOrCreate({
        where: { id_user: admin.id },
        defaults: { id_user: admin.id, identifiant_public: identifiantPublic, solde_portefeuille: 0 },
      });
    }

    const ticketTypes = [
      { name: "IT",                         description: "Support IT",                         specialist_user_id: it.id },
      { name: "Logistique",                 description: "Support Logistique",                 specialist_user_id: logistique.id },
      { name: "Financier",                  description: "Support Financier",                  specialist_user_id: financier.id },
      { name: "Compte",                     description: "Support Compte",                     specialist_user_id: compte.id },
      { name: "Formation",                  description: "Support Formation",                  specialist_user_id: formation.id },
      { name: "Produit",                    description: "Support Produit",                    specialist_user_id: produit.id },
      { name: "Demande de Fonctionnalité",  description: "Support Demande de Fonctionnalité",  specialist_user_id: fonctionnalite.id },
      { name: "Confirmation Stock",         description: "Support Confirmation Stock",         specialist_user_id: confirmationStock.id },
      { name: "Autre",                      description: "Autre Support",                      specialist_user_id: admin.id },
    ];

    for (const tt of ticketTypes) {
      await TicketsType.findOrCreate({ where: { name: tt.name }, defaults: tt });
    }

    console.log("Seed complete — specialists, admin, and ticket types are present.");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seed();