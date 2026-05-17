// Africa's Talking WhatsApp + SMS integration
const AfricasTalking = require("africastalking");

const at = AfricasTalking({
  apiKey: process.env.AT_API_KEY!,
  username: process.env.AT_USERNAME!,
});

const smsService = at.SMS;

interface WhatsAppParams {
  to: string;    // 254XXXXXXXXX
  message: string;
}

interface SMSParams {
  to: string;
  message: string;
}

export async function sendWhatsApp({ to, message }: WhatsAppParams): Promise<void> {
  // Africa's Talking WhatsApp API
  const response = await fetch("https://chat.africastalking.com/whatsapp/message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apiKey": process.env.AT_API_KEY!,
    },
    body: JSON.stringify({
      username: process.env.AT_USERNAME,
      to,
      message,
      channel: "whatsapp",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WhatsApp send failed: ${response.status} ${text}`);
  }
}

export async function sendSMS({ to, message }: SMSParams): Promise<void> {
  await smsService.send({
    to: [to],
    message,
    from: process.env.AT_SMS_SENDER_ID,
  });
}
