// Alias for the C2B validation/confirmation webhook — Daraja rejects URLs
// containing "mpesa"/"safaricom", so register this path in the Daraja portal.
export { POST } from "../../mpesa/c2b/route";
