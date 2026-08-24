// Alias for the C2B validation/confirmation webhook — Daraja rejects URLs
// containing "mpesa"/"safaricom", so register this path in the Daraja portal.
export { /* @next-codemod-error `POST` export is re-exported. Check if this component uses `params` or `searchParams`*/
POST } from "../../mpesa/c2b/route";
