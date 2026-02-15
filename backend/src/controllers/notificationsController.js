import Produit from "../models/Produit.js";
import Notification from "../models/Notification.js";
import MesProduit from "../models/MesProduit.js";

export const createStockNotification = async (produit, oldStock, newStock) => {
  try {
    if (oldStock === newStock) return;

    // ⭐ 1. Notifier tous les vendeurs
    const vendeurs = await MesProduit.findAll({
      where: { id_produit: produit.id }
    });

    for (const v of vendeurs) {
      await Notification.create({
        id_user: v.id_vendeur,
        id_produit: produit.id,
        message: `Le stock du produit ${produit.nom} a été mis à jour`
      });
    }

    // ⭐ 2. Notifier le fournisseur
    if (produit.id_fournisseur) {
      await Notification.create({
        id_user: produit.id_fournisseur,
        id_produit: produit.id,
        message: `Le stock de votre produit ${produit.nom} a changé (${oldStock} → ${newStock})`
      });
    }

  } catch (err) {
    console.error("Erreur notification:", err);
  }
};

export const notifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.findAll({
      where: { id_user: userId },
      order: [["cree_le", "DESC"]],
      limit: 10
    });

    res.json(notifications);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const allNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.findAll({
      where: { id_user: userId },
      order: [["cree_le", "DESC"]],
      // Pas de limite ici
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    await Notification.destroy({
      where: { id_user: userId }
    });
    res.status(204).send(); // 204 = No Content (succès)
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const id_user = req.user.id;

    await Notification.update(
      { vu: true }, // mettre vu à true
      { where: { id_user, vu: false } } // seulement celles non lues
    );

    return res.json({ message: "Toutes les notifications ont été marquées comme lues." });
  } catch (err) {
    console.error("Erreur mark-all-read:", err);
    return res.status(500).json({
      message: "Erreur serveur lors du marquage des notifications.",
      error: err.message
    });
  }
};

export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    const produit = await Produit.findByPk(id);
    if (!produit) return res.status(404).json({ error: "Produit non trouvé" });

    const oldStock = produit.stock;

    produit.stock = stock;
    await produit.save();

    await createStockNotification(produit, oldStock, stock);

    res.json({ message: "Stock mis à jour", produit });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

