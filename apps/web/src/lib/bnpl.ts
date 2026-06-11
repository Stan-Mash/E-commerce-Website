// Buy-now-pay-later (instalments) via a provider-hosted checkout link.
// Provider-agnostic: BNPL_PAYMENT_URL_TEMPLATE holds the merchant checkout URL
// with {amount}, {ref} and {phone} placeholders, e.g.
//   https://pay.lipalater.com/checkout?merchant=XXX&amount={amount}&reference={ref}&msisdn={phone}
// NEXT_PUBLIC_BNPL_NAME (e.g. "Lipa Later") makes the option visible in checkout.
// Both unset -> feature hidden, like the email/B2C optional providers.

export function isBNPLConfigured(): boolean {
  return !!process.env.BNPL_PAYMENT_URL_TEMPLATE;
}

export function buildBNPLLink(
  template: string,
  params: { amount: number; ref: string; phone: string }
): string {
  return template
    .replaceAll("{amount}", String(Math.round(params.amount)))
    .replaceAll("{ref}", encodeURIComponent(params.ref))
    .replaceAll("{phone}", encodeURIComponent(params.phone));
}
