import { User, Vendeur, Transaction, Parrainage,Pack } from '../models/index.js';

export async function applyParrainage(newUser, packFilleul, transaction) {
  try {
    console.log(`=== NOUVELLE VERSION applyParrainage (continue après niveau 3) ===`);
    console.log(`Début applyParrainage pour user ${newUser.id}`);
    
    const vendeurRow = await Vendeur.findOne({ 
      where: { id_user: newUser.id },
      transaction 
    });
    
    if (!vendeurRow) {
      console.log('Vendeur non trouvé');
      return;
    }

    let niveau = 1;
    let currentParrainId = vendeurRow.parraine_par;

    console.log(`Parrain direct: ${currentParrainId}`);

    // CORRECTION ICI : Supprimer la limite de niveau
    while (currentParrainId) { // Seulement vérifier s'il y a encore un parrain
      console.log(`Traitement niveau ${niveau} pour parrain ${currentParrainId}`);
      
      const parrainVendeur = await Vendeur.findOne({ 
        where: { id_user: currentParrainId },
        transaction 
      });
      
      if (!parrainVendeur) {
        console.log(`Parrain ${currentParrainId} non trouvé dans Vendeur`);
        break;
      }

      // Récupérer le pack du parrain
      const packParrain = await Pack.findOne({ 
        where: { cle: parrainVendeur.pack_cle },
        transaction 
      });
      
      if (!packParrain) {
        console.log(`Pack du parrain ${currentParrainId} non trouvé`);
        break;
      }

      let montantPackParrain = parseFloat(packParrain.prix);
      let pourcentage;
      if (niveau === 1) {
        pourcentage = 0.20; // 20%
      } else if (niveau === 2) {
        pourcentage = 0.10; // 10%
      } else {
        pourcentage = 0.05; // 5% pour niveau 3 et supérieurs
      }
      const bonus = +(montantPackParrain * pourcentage).toFixed(2);
      
      console.log(`Bonus niveau ${niveau}: ${bonus} (${pourcentage*100}% de ${montantPackParrain})`);

      // Mise à jour du solde portefeuille du parrain
      parrainVendeur.solde_portefeuille = (+parrainVendeur.solde_portefeuille) + bonus;
      await parrainVendeur.save({ transaction });

      // Enregistrement de la transaction bonus_parrainage
      await Transaction.create({
        id_utilisateur: currentParrainId,
        type: 'bonus_parrainage',
        montant: bonus,
        meta: { 
          niveau, 
          from: newUser.id, 
          packFilleul: packFilleul.cle, 
          packParrain: packParrain.cle,
          pourcentage: pourcentage * 100
        }
      }, { transaction });

      // Enregistrement du parrainage
      await Parrainage.create({
        id_parrain: currentParrainId,
        id_parrained: newUser.id,
        niveau
      }, { transaction });

      console.log(`Parrainage niveau ${niveau} enregistré pour ${currentParrainId} -> ${newUser.id}`);

      // Passer au parrain suivant (niveau supérieur)
      currentParrainId = parrainVendeur.parraine_par;
      niveau++;
    }

    console.log('Fin applyParrainage - Dernier niveau traité:', niveau - 1);

  } catch (err) {
    console.error('Erreur dans applyParrainage:', err);
    throw err; // Important : propager l'erreur pour le rollback
  }
}

  /* try {
    const vendeurRow = await Vendeur.findOne({ where: { id_user: newUser.id } });
    if (!vendeurRow) return;

    let niveau = 1;
    let pourcentages = [0.20, 0.10, 0.05]; // niveau1, niveau2, niveau3...
    let currentParrainId = vendeurRow.parraine_par;

    while (currentParrainId && niveau <= pourcentages.length) {
      const parrainVendeur = await Vendeur.findOne({ where: { id_user: currentParrainId } });
      if (!parrainVendeur) break;

      // récupérer le pack du parrain
      const packParrain = await Pack.findOne({ where: { cle: parrainVendeur.pack_cle } });
      if (!packParrain) break;

      let montantPackParrain = parseFloat(packParrain.prix);

      // calcul du bonus selon le pack du parrain
      const bonus = +(montantPackParrain * pourcentages[niveau - 1]).toFixed(2);

      // ajout au solde portefeuille du parrain
      parrainVendeur.solde_portefeuille = (+parrainVendeur.solde_portefeuille) + bonus;
      await parrainVendeur.save();

      // enregistrer transaction
      await Transaction.create({
        id_utilisateur: currentParrainId,
        type: 'bonus_parrainage',
        montant: bonus,
        meta: { niveau, from: newUser.id, packFilleul: packFilleul.cle, packParrain: packParrain.cle }
      });

      // enregistrer parrainage
      await Parrainage.create({
        id_parrain: currentParrainId,
        id_parrained: newUser.id,
        niveau
      });

      // passer au parrain suivant
      currentParrainId = parrainVendeur.parraine_par;
      niveau++;
    }
  } catch (err) {
    console.error('Erreur applyParrainage', err);
  }
} */