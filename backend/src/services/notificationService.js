import twilio from "twilio";

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

export async function sendWhatsApp(toNumber, message) {
  try {
    await client.messages.create({
      from: "whatsapp:" + process.env.WHATSAPP_NUMBER, // ton numéro Twilio
      to: "whatsapp:" + toNumber,
      body: message,
    });
    console.log("WhatsApp envoyé à", toNumber);
  } catch (err) {
    console.error("Erreur envoi WhatsApp", err.message);
  }
}

export async function sendEmail(toEmail, subject, body) {
  console.log("Email ->", toEmail, subject, body);
}

export async function notifyAssignee(user, ticket, initialMessage) {
  const msg = `📩 Nouveau Ticket #${ticket.code}\n` +
              `Titre: ${ticket.title}\n` +
              `Message: ${initialMessage}`;

  if (user.telephone) await sendWhatsApp(user.telephone, msg);
  if (user.email) await sendEmail(user.email, "Nouveau ticket", msg);
}