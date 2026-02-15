import bcrypt from 'bcrypt';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { User, Vendeur, Fournisseur, Pack, Parrainage, Transaction } from '../models/index.js';
import sequelize from "../config/database.js";
import {applyParrainage } from '../utils/parrainage.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const SALT_ROUNDS = 10;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
      user: process.env.MAIL_USER,  // ton Gmail
      pass: process.env.MAIL_PASS   // mot de passe d'application Gmail
  },
  tls: {
    rejectUnauthorized: false
  }
});

export async function sendActivationEmail(user, token) {
  const activationLink = `${process.env.BACKEND_URL}/api/auth/activate?token=${token}`;

  await transporter.sendMail({
    from: `"Nexa App" <${process.env.MAIL_USER}>`,
    to: user.email,
    subject: "Activation de votre compte",
    html: `
      <p>Bonjour ${user.nom},</p>
      <p>Merci de vous être inscrit. Cliquez sur le lien ci-dessous pour activer votre compte :</p>
      <a href="${activationLink}">Activer mon compte</a>
      <p>Ce lien expire dans 24h.</p>
    `
  });
}

export async function activateUser(req, res) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'Token manquant' });

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l’utilisateur à partir de l’ID dans le token
    const user = await User.findByPk(decoded.id);

    if (!user) return res.status(400).json({ message: 'Utilisateur introuvable' });
    if (user.validation) return res.json({ message: 'Compte déjà activé' });

    // Activer le compte
    user.validation = true;
    await user.save();

    res.json({ message: 'Compte activé ✅' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Lien invalide ou expiré' });
  }
}


  function isPasswordValid(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(password);
  }
  export async function registerVendeur(req, res) {
  const t = await sequelize.transaction();
  try {
    
    const { nom, email, telephone, mot_de_passe, confirmer_mot_de_passe, gouvernorat, ville, adresse, pack_cle, code_parrainage, facebook_url, instagram_url } = req.body;
    console.log(req.body)
    if (!nom || !email || !mot_de_passe || !confirmer_mot_de_passe || !gouvernorat || !ville || !adresse || !pack_cle)
      return res.status(400).json({ message: 'Champs requis manquants' });

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email déjà utilisé' });

    // Vérifier mot de passe == confirmation
    if (mot_de_passe !== confirmer_mot_de_passe) {
      return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });
    }

    // Vérifier la complexité du mot de passe
    if (!isPasswordValid(mot_de_passe)) {
      return res.status(400).json({
        message: "Mot de passe invalide : minimum 8 caractères, incluant une majuscule, une minuscule et un chiffre"
      });
    }

    const hashed = await argon2.hash(mot_de_passe, { type: argon2.argon2id });

    const user = await User.create({
      nom, email, telephone,
      mot_de_passe: hashed,
      role: 'vendeur',
      gouvernorat, ville, adresse,
      facebook_url, instagram_url,
      actif: false, // utilisateur non actif jusqu'à activation
      validation: false
    }, { transaction: t });

    const generatedCode = `VEND-${user.id}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;

    let parrain_user_id = null;
    
    if (code_parrainage) {
      const parrain = await Vendeur.findOne({ 
        where: { code_parrainage },
        transaction: t 
      });
      if (parrain) parrain_user_id = parrain.id_user;
    }

    await Vendeur.create({
      id_user: user.id,
      code_parrainage: generatedCode,
      parraine_par: parrain_user_id,
      solde_portefeuille: 0,
      pack_cle
    }, { transaction: t });

    // if pack has price >0, you can create a transaction 'achat_pack' and then apply parrainage
    const pack = await Pack.findOne({ where: { cle: pack_cle }, transaction: t });
    if (pack) {
      if (parseFloat(pack.prix) > 0) {
        // create transaction achat_pack for user (pour simplifier, Etat: payable later)
        await Transaction.create({
          id_utilisateur: user.id,
          type: 'achat_pack',
          montant: pack.prix,
          meta: { pack: pack.cle }
        }, { transaction: t });
      }
      
      // apply parrainage bonuses (20/10/5/5/5...)
      if (parrain_user_id) {
        // IMPORTANT: S'assurer que c'est la nouvelle version de applyParrainage
        await applyParrainage(user, pack, t);
      }
    }

    // Générer token JWT pour activation
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Envoyer mail de validation
    await sendActivationEmail(user, token);
    
    // UN SEUL COMMIT ici
    await t.commit();

    res.status(201).json({
      message: 'Vendeur créé. Veuillez activer votre compte via le mail envoyé.',
      user: { id: user.id, email: user.email, nom: user.nom },
      code_parrainage: generatedCode,
      lien_parrainage: `${process.env.FRONTEND_URL}/auth/signup?code=${generatedCode}`
    });

  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}
export async function registerFournisseur(req, res) {
  try {
    const { nom, email, telephone, mot_de_passe, confirmer_mot_de_passe, gouvernorat, ville, adresse, identifiant_public, facebook_url, instagram_url } = req.body;

    if (!nom || !email || !mot_de_passe || !confirmer_mot_de_passe || !gouvernorat || !ville || !adresse || !identifiant_public)
      return res.status(400).json({ message: 'Champs requis manquants' });

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email déjà utilisé' });

     // Vérifier mot de passe == confirmation
    if (mot_de_passe !== confirmer_mot_de_passe) {
      return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });
    }

    // Vérifier la complexité du mot de passe
    if (!isPasswordValid(mot_de_passe)) {
      return res.status(400).json({
        message: "Mot de passe invalide : minimum 8 caractères, incluant une majuscule, une minuscule et un chiffre"
      });
    }


    const hashed = await argon2.hash(mot_de_passe, { type: argon2.argon2id });

    const user = await User.create({
      nom, email, telephone,
      mot_de_passe: hashed,
      role: 'fournisseur',
      gouvernorat, ville, adresse,
      facebook_url, instagram_url,
      actif: false // utilisateur non actif jusqu'à activation
    });

    const identifiantPublic = `PUB-${user.id}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;

    await Fournisseur.create({
      id_user: user.id,
      identifiant_public: identifiantPublic,
      solde_portefeuille: 0
    });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    await sendActivationEmail(user, token);

    res.status(201).json({
      message: 'Fournisseur créé. Veuillez activer votre compte via le mail envoyé.',
      user: { id: user.id, email: user.email, nom: user.nom }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

export async function login(req, res) {
  const { email, mot_de_passe } = req.body;
  const user = await User.findOne({ where: { email } });

  if (!user) return res.status(401).json({ message: "Identifiants invalides" });

  const ok = await argon2.verify(user.mot_de_passe, mot_de_passe);
  if (!ok) return res.status(401).json({ message: "Identifiants invalides" });

  if (!user.actif)
    return res.status(403).json({ message: "Compte non activé par l’admin" });

  // Access token
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "4h" }
  );

  // Création refresh token brut + hash
  const rawRefreshToken = crypto.randomBytes(64).toString("hex");
  const hashedRefreshToken = await bcrypt.hash(rawRefreshToken, 10);

  // Sauvegarde hashée dans la DB
  await User.update(
    { refresh_token: hashedRefreshToken },
    { where: { id: user.id } }
  );

  res.cookie("accessToken", accessToken, {
    httpOnly: true,                    // Empêche l'accès via JavaScript (protection XSS)
    secure: process.env.NODE_ENV === "production", // Seulement en HTTPS en prod
    sameSite: "strict",                // Protection CSRF
    maxAge: 4 * 60 * 60 * 1000,        // 4 heures
  });

  // Envoyer en cookie sécurisé HttpOnly
  res.cookie("refreshToken", rawRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
  });

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      nom: user.nom,
      role: user.role,
    },
  });
}

export async function refresh(req, res) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token manquant" });
    }
    // Chercher l'utilisateur avec le refresh token hashé
    const users = await User.findAll({
      where: {
        refresh_token: { [Op.not]: null }
      }
    }); // Tu peux filtrer par id si tu stockes autre info
    const user = users.find(u => {
      if (!u.refresh_token) return false;
      return bcrypt.compareSync(refreshToken, u.refresh_token);
    });

    if (!user) return res.status(401).json({ message: "Token invalide" });

    // --- Générer nouveaux tokens ---
    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "4h" }
    );

    const newRawRefreshToken = crypto.randomBytes(64).toString("hex");
    const newHashedRefreshToken = await bcrypt.hash(newRawRefreshToken, 10);

    await User.update(
      { refresh_token: newHashedRefreshToken },
      { where: { id: user.id } }
    );

    // --- Envoyer cookies sécurisés ---
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 4 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", newRawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({ message: "Token renouvelé" });
  } catch (err) {
    console.error("Refresh error:", err);
    return res.status(500).json({ message: "Erreur refresh token" });
  }
}

export async function logout(req, res) {
  try {
    // Nettoyer les cookies côté client
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    
    // Optionnel: nettoyer le refresh token en base de données
    if (req.user?.id) {
      await User.update(
        { refresh_token: null },
        { where: { id: req.user.id } }
      );
    }
    
    return res.json({ message: "Déconnecté avec succès" });
  } catch (err) {
    console.error("Erreur logout:", err);
    return res.status(500).json({ message: "Erreur lors de la déconnexion" });
  }
}

  export async function registerAdmin(req, res) {
  try {
    const { nom, email, telephone, mot_de_passe, gouvernorat, ville, adresse, facebook_url, instagram_url } = req.body;

    if (!nom || !email || !mot_de_passe || !gouvernorat || !ville || !adresse)
      return res.status(400).json({ message: 'Champs requis manquants' });

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email déjà utilisé' });

    const hashed = await argon2.hash(mot_de_passe, { type: argon2.argon2id });

    const admin = await User.create({
      nom, email, telephone,
      mot_de_passe: hashed,
      role: 'admin',
      gouvernorat, ville, adresse,
      facebook_url, instagram_url,
      actif: true // admin actif directement
    });

    // Générer un identifiant_public unique
    const identifiantPublic = `PUB-${admin.id}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;

    await Fournisseur.create({
      id_user: admin.id,
      identifiant_public: identifiantPublic,
      solde_portefeuille: 0
    });

    res.status(201).json({
      message: 'Admin créé avec rôle Fournisseur',
      admin: { 
        id: admin.id, 
        email: admin.email, 
        nom: admin.nom, 
        identifiant_public: identifiantPublic 
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}
