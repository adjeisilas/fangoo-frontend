/**
 * llms.txt — a plain-language summary of the site for language models.
 * Served dynamically so links always resolve to the deployed origin.
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);
  const siteUrl = String(config.public.siteUrl).replace(/\/+$/, '');

  const body = `# Fangoo

> Fangoo is a B2B fuel marketplace and delivery platform in Ghana. Buyers compare
> verified fuel suppliers, see live prices per litre, and have petrol, diesel,
> kerosene or LPG delivered to their site. Prices are quoted in Ghana Cedis (GHS).

## What Fangoo does

Fangoo works two ways:

- **Catalogue**: buyers browse verified suppliers, compare price per litre, check
  available stock and minimum order, then order and pay online.
- **Request for quote**: a buyer posts a fuel requirement (fuel type, volume,
  delivery area and deadline). Verified suppliers that cover that area bid a
  delivered price. The buyer compares the bids and awards one, which becomes an
  order at the agreed price.

- Suppliers list the fuels they carry, set their own price, stock level and
  minimum order, and define which areas they deliver to and at what fee.
- Every supplier is verified by an administrator before they can trade or bid.
- Suppliers never see a rival's bid on a request.
- One order always belongs to exactly one supplier.

## Key pages

- [Home](${siteUrl}/): what Fangoo is, in brief.
- [How it works](${siteUrl}/how-it-works): both buying routes (catalogue and request
  for quote), how suppliers sell, and the rules enforced on every order.
- [Fuel marketplace](${siteUrl}/marketplace): every available listing, filterable by
  fuel type, delivery area, supplier and maximum price per litre.
- [Supplier pages](${siteUrl}/marketplace/): each verified supplier's live prices,
  stock, minimum order, delivery coverage and customer reviews.

## How ordering works

1. The buyer either picks a supplier from the catalogue, or posts a requirement and
   awards one of the offers it attracts.
2. Pricing is calculated on the server — from the supplier's current listing for a
   catalogue order, or from the accepted offer for an awarded request — never from
   anything the browser sends.
3. Payment is handled by Paystack and verified server-side before an order advances.
4. Catalogue stock is decremented only once payment is confirmed.
5. The supplier confirms, prepares and dispatches the order; the buyer confirms
   delivery.
6. After delivery the buyer may leave one review for that order.

## Notes for automated readers

- Account, checkout, order, request, supplier-dashboard and admin pages require
  authentication and are excluded from search indexing and from the sitemap.
- Prices, stock levels and order state shown on public pages are read from the
  live API and change frequently.
- Sitemap: ${siteUrl}/sitemap.xml
`;

  setHeader(event, 'content-type', 'text/plain; charset=utf-8');
  setHeader(event, 'cache-control', 'public, max-age=3600');

  return body;
});
