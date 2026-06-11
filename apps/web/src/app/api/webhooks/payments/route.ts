// Alias for the STK-push callback. Daraja rejects callback URLs containing
// the words "mpesa" or "safaricom", so the registered CallBackURL points here
// instead of /api/webhooks/mpesa. Same handler, neutral path.
export { POST } from "../mpesa/route";
