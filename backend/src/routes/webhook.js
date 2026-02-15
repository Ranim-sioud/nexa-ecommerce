import express from "express";
import { Tickets, TicketsMessage } from "../models/index.js";

const router = express.Router();

router.post("/whatsapp", async (req, res) => {
  const { From, Body } = req.body; // Twilio payload
  console.log("WhatsApp reçu:", From, Body);

  // convention : admin ou spécialiste répond en commençant par "#<code>"
  const match = Body.match(/^#(\w+)\s+(.+)/);
  if (!match) return res.sendStatus(200);

  const code = match[1];
  const messageText = match[2];

  const ticket = await Tickets.findOne({ where: { code } });
  if (!ticket) return res.sendStatus(200);

  const adminOrSpecialist = await User.findOne({ where: { telephone: From.replace("whatsapp:", "") } });
  if (!adminOrSpecialist) return res.sendStatus(200);

  await TicketsMessage.create({
    tickets_id: ticket.id,
    sender_id: adminOrSpecialist.id,
    body: messageText,
    channel: "whatsapp",
  });

  res.sendStatus(200);
});

export default router;