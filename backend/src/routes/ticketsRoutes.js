import express from "express";
import { createTickets, listTickets, getTicketsDetail, postMessage, getAllTicketTypes, updateTicketStatus } from "../controllers/ticketsController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/",requireAuth, createTickets);
router.get("/",requireAuth, listTickets);
router.get("/types",requireAuth, getAllTicketTypes);
router.get("/:id",requireAuth, getTicketsDetail);
router.post("/:ticketId/messages",requireAuth, postMessage);
router.post("/tickets/:id/status", requireAuth, updateTicketStatus);

export default router;