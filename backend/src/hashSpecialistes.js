import User from './models/User.js';
import sequelize from './config/database.js';
import argon2 from 'argon2';

async function hashSpecialistes() {
  try {
    await sequelize.authenticate();

    // Récupère tous les spécialistes
    const specialistes = await User.findAll({ where: { role: 'specialiste' } });

    for (let user of specialistes) {
      // Hache le mot de passe actuel
      const hashed = await argon2.hash(user.mot_de_passe, { type: argon2.argon2id });

      // Mets à jour le mot de passe haché
      await User.update(
        { mot_de_passe: hashed },
        { where: { id: user.id } }
      );

      console.log(`✅ Mot de passe hashé pour ${user.nom} (${user.email})`);
    }

    console.log("✅ Tous les spécialistes ont désormais un mot de passe hashé !");
    process.exit();
  } catch (err) {
    console.error("❌ Erreur :", err);
    process.exit(1);
  }
}

hashSpecialistes();