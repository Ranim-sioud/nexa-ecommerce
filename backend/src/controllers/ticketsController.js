import { Tickets, TicketsType, TicketsMessage, User } from "../models/index.js";
import { notifyAssignee } from "../services/notificationService.js";
import { Op } from "sequelize";

// helper to create code ET-xxxx
function generateCode() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `ET-${n}`;
}

export async function createTickets(req, res) {
  try {
    const { title, product_code, type_id, initial_message } = req.body;
    if (!title || !type_id) {
      return res.status(400).json({ message: "Titre et type requis" });
    }

    const type = await TicketsType.findByPk(type_id, {
      include: [{ model: User, as: "specialist" }],
    });
    if (!type) return res.status(404).json({ message: "Type non trouvé" });

    const code = generateCode();

    // si "Autre", assigner admin
    let assigned_to = null;
    if (type.name === "Autre") {
      const admin = await User.findOne({ where: { role: "admin" } });
      assigned_to = admin ? admin.id : null;
    } else {
      assigned_to = type.specialist_user_id || null;
    }

    const tickets = await Tickets.create({
      code,
      title,
      product_code,
      creator_id: req.user.id,
      type_id,
      assigned_to,
    });

    if (initial_message) {
      await TicketsMessage.create({
        tickets_id: tickets.id,
        sender_id: req.user.id,
        body: initial_message,
        channel: "portal",
      });
    }

    // notifier le destinataire
    if (assigned_to) {
      const assignee = await User.findByPk(assigned_to);
      await notifyAssignee(assignee, tickets, initial_message);
    }

    res.json({ tickets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur création tickets", error: err.message });
  }
}

export async function listTickets(req, res) {
  try {
    const where = {};

    if (req.user.role === "vendeur" || req.user.role === "fournisseur") {
      where.creator_id = req.user.id;
    } 
    else if (req.user.role === "specialiste") {
      where.assigned_to = req.user.id;
    }
    // admin voit tout (+ filtres)
    else if (req.user.role === "admin") {
      if (req.query.status) where.status = req.query.status;
      if (req.query.assigned_to) where.assigned_to = req.query.assigned_to;
    }

    const tickets = await Tickets.findAll({
      where,
      include: [
        { model: TicketsType, as: "type" },
        { model: User, as: "creator", attributes: ["id", "nom", "email"] },
        { model: User, as: "assignee", attributes: ["id", "nom", "email", "telephone"] }
      ],
      order: [["created_at", "DESC"]]
    });

    res.json({ tickets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur list tickets" });
  }
}

export async function getTicketsDetail(req, res) {
  try {
    const tickets = await Tickets.findByPk(req.params.id, {
      include: [
        { model: TicketsType, as: "type" },
        { model: User, as: "creator", attributes: ["id","nom","email","telephone"] },
        { model: User, as: "assignee", attributes: ["id","nom","email","telephone"] },
        { model: TicketsMessage, include: [{ model: User, as: "sender", attributes: ["id","nom"] }] }
      ]
    });
    if (!tickets) return res.status(404).json({ message: "Tickets non trouvé" });
    // ensure authorization
    if (req.user.role !== "admin" && tickets.creator_id !== req.user.id && tickets.assigned_to !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    res.json({ tickets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur tickets detail" });
  }
}

export async function postMessage(req, res) {
  try {
    const { ticketId } = req.params;
    const { body, channel } = req.body;

    if (!body) return res.status(400).json({ message: "Message requis" });

    const tickets = await Tickets.findByPk(ticketId);
    if (!tickets) return res.status(404).json({ message: "Tickets non trouvé" });

    if (
      req.user.role !== "admin" &&
      req.user.id !== tickets.creator_id &&
      req.user.id !== tickets.assigned_to
    ) {
      return res.status(403).json({ message: "Pas autorisé" });
    }

    const msg = await TicketsMessage.create({
      tickets_id: tickets.id,
      sender_id: req.user.id,
      body,
      channel: channel || "portal",
    });

    // notification en miroir (si admin ou spécialiste écrit → notifier utilisateur créateur)
    if (req.user.id === tickets.assigned_to || req.user.role === "admin") {
      const creator = await User.findByPk(tickets.creator_id);
      await notifyAssignee(creator, tickets, body);
    }

    res.json({ message: msg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur envoi message" });
  }
}

export const getAllTicketTypes = async (req, res) => {
  try {
    const types = await TicketsType.findAll();
    res.status(200).json({ types });
  } catch (error) {
    console.error("Erreur getAllTicketTypes:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export async function updateTicketStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; // "ouvert" | "en_attente" | "ferme"

    const ticket = await Tickets.findByPk(id);
    if (!ticket) return res.status(404).json({ message: "Ticket non trouvé" });

    ticket.status = status;
    await ticket.save();

    res.json({ message: "Statut mis à jour", ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur mise à jour statut" });
  }
}