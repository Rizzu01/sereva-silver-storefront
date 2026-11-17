# Sereva — a feeling, in silver

A complete **HTML, CSS and vanilla JavaScript storefront preview**, prepared for Vercel review and a later WordPress/WooCommerce implementation. Sereva replaces the original store name in the visible design. The primary brand colours and observed desktop/mobile navigation hierarchy are preserved.

The catalog snapshot contains **304 products and 240 variations**, with published INR prices, specifications, stock states and product photography captured on **17 November 2026**. This is a design preview: **accounts, checkout, payment and orders are browser simulations**, not live WooCommerce transactions.

## Deploy on Vercel

1. Import `Rizzu01/sereva-silver-storefront` and select branch **main**.
2. Keep **Root Directory** at the repository root. Framework preset: **Other**.
3. The committed `vercel.json` sets **Output Directory: dist**, skips installation/build, and supplies deep-link fallback. No environment variables or API keys are required.
4. Deploy, then review `/`, `/shop/`, a product URL, `/cart/`, `/checkout/` and `/my-account/`. A refresh on a product/category path should work.

The preview has `noindex` headers and `robots.txt` blocking indexing. Remove those only for an approved production implementation. Vercel hosting is deliberately left to the client, as requested.

## Local preview

```sh
python3 scripts/serve.py --port 3000
```

Open `http://localhost:3000`. Use an HTTP server with route fallback; opening the HTML as `file://` does not support the route structure.

## What works in the preview

- Luxury homepage; original hierarchy in a desktop mega menu and expandable mobile menu; category discovery, collections, product/tag archives and preserved URLs.
- Search suggestions/results, price/category/attribute/finish/availability filtering, sort, load more and legacy pagination paths.
- All 304 product pages, galleries, zoom, original variation labels, variation-specific price/availability, quantity controls and clear unavailable/out-of-stock states.
- Browser wishlist, three-product comparison, bag drawer/page, quantity/removal, valid/invalid preview coupons (`SEREVA10`).
- Checkout validation, sandbox-success/decline UI, local order confirmation and demo order tracking. No gateway or courier is contacted.
- Account sign-in/registration/reset previews, dashboard, preview orders, address/profile editing and logout. Passwords are discarded; no credential or account is stored.
- Our Story, Jewellery Care, FAQs, Contact, policy pages, journal/archive layouts and documented holds for legacy/demo pages.

Wishlist, bag, comparison and non-personal preview order summaries persist in localStorage. Account/profile/address values exist only in memory. Contact/checkout address data is not sent or persisted. Use sample details throughout.

## Files

| File | Purpose |
| --- | --- |
| `dist/index.html` | Semantic app shell, dialogs and metadata. |
| `dist/style.css` | Extracted colour tokens, reusable components, responsive styles and reduced-motion rules. |
| `dist/store.js` | Routing, templates and browser-only interactions. |
| `dist/catalog.js` | Public catalog snapshot with product/category/tag mapping. |
| `dist/variations.js` | 240 variation-specific price and stock records. |
| `dist/content.js` | Sanitized, adapted content snapshot. |
| `dist/assets/` | Local images, fonts, licences and explicit missing-photo placeholder. |
| `vercel.json` | Static deployment and route fallback. |
| `scripts/check.mjs` | Meaningful DOM interaction and catalog/route checks. |

## Audit and handover

- [Source audit, findings and blockers](docs/AUDIT.md)
- [Page and feature coverage map — 3,382 entries](docs/page-feature-map.csv)
- [Machine-readable route inventory](docs/route-inventory.json)
- [Proposed redirects — none approved or applied](docs/redirect-map.csv)
- [Design research, tokens and component system](docs/DESIGN.md)
- [Asset provenance](docs/asset-provenance.csv) and [missing product images](docs/missing-product-images.json)
- [WordPress/WooCommerce handover](docs/WOOCOMMERCE.md)
- [Verification and review checklist](docs/VERIFICATION.md)

## Checks

```sh
npm ci
npm run check
npm test
```

Node 24.15+ is recommended for the development-only DOM test dependency. No Node dependency is needed to serve the storefront. Syntax checks and 15 interaction/data/route test groups pass. **Browser layout, touch/keyboard navigation and mobile performance remain unverified:** the managed preview service could not open its browser relay. These are explicitly recorded, not marked as passed.

## Approval boundary

Per the client’s revised instruction, this delivery is the repository for Vercel review. **No staging storefront, live authentication, payment sandbox purchase or WordPress installation is claimed complete.** The later implementation must use native WooCommerce sessions, inventory, accounts, taxes, shipping, gateways, order records and email, preserving existing customer/order data. Policy conflicts, Sereva business/contact details, 16 missing product photos, sizing chart and final photography approval remain listed for that stage.
