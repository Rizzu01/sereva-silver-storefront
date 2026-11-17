# Verification record

## Passed

`npm run check`: syntax of application, catalog, content and variation scripts.

`npm test`: 16 DOM integration/data/route groups using jsdom. These exercise the actual app DOM and events; they do not provide browser layout measurements.

1. Homepage category/product composition; 304 products; 240 variation records; all primary image paths exist.
2. Desktop mega-menu toggle and preserved mobile menu reading order.
3. Search suggestions and no-results state.
4. Category/stock/price filters, price sort, load more and legacy `/shop/page/2/` routing.
5. Required variation selection, availability and Add to Bag.
6. Wishlist add/persist/remove/empty state.
7. Three-product comparison mechanism and empty state.
8. Bag quantity, valid/invalid coupon behaviour.
9. Payment-decline state, retained bag, retry success, confirmation and bag clearing. These are simulations; no gateway is used.
10. Local preview order lookup and missing-order error.
11. Registration preview, dashboard, order list, address/profile editing and logout. No password persisted.
12. Sign-in preview, safe same-site return path, password-reset message with explicit no-email status.
13. Contact validation and explicit unsent-message state.
14. Pagination/filter recovery, URL sort selection, source taxonomy breadcrumbs, separated product specifications, eager primary photo, synchronized mobile variation price and two unavailable-pricing options.
15. Every one of 304 product routes, 13 nonempty category templates, standard support/policy routes, duplicate aliases, legacy holds, unknown route and out-of-stock CTA.
16. No JavaScript exceptions throughout these interactions and route assertions.

## Not verified / deferred

| Check | Status and reason |
| --- | --- |
| New-build browser screenshots and visual layout | Blocked by managed preview relay timeout on port 4173. No screenshot is represented as taken from the new storefront. |
| Real browser keyboard, focus containment, touch and responsive overflow | Outstanding after Vercel deployment. Semantic controls, native dialogs, focus styles and responsive CSS implemented; jsdom cannot establish real usability. |
| Mobile Lighthouse / Core Web Vitals | Outstanding on the deployed URL. Fonts subset to ~47 KB total; local product WebP files, explicit dimensions and lazy loading implemented, but no measured score claimed. |
| Every individual tag/pagination source page | Inventoried, not all fetched or visually inspected. Common frontend template is exercised; individual routes carry their own status in the map. |
| Complete original sitemap | Second product-tag sitemap returns 404; public API supplements taxonomy. Unknown unpublished/restricted content cannot be claimed covered. |
| Live WP accounts/password emails | Deferred by client until design approval and WordPress access. Preview forms do not authenticate. |
| Live WooCommerce tax/shipping/coupons/stock quantities | Deferred; snapshot catalog and local cart are not authoritative. |
| Complete gateway sandbox purchase | Deferred until WooCommerce staging with the configured providers. Local success/decline UI is not a sandbox gateway transaction. |
| Contact/email/courier delivery | Not connected in this static preview. |
| Final policy/contact/photography approval | Open; conflicts, placeholder business details and asset provenance documented. |

## Vercel review checklist

Import the repository with the root unchanged, framework Other and output directory `dist`. No build or environment variable is required. Open a deep product/category URL directly and refresh it.

Review at 320, 375, 390, 430, 768, 1024 and 1440 pixels. Check the hero crop, menu spacing, two-column phone product grid, drawer scrolling, gallery thumbnails, purchase bar, footer, focus visibility, labels, colour contrast and absence of horizontal page overflow. Verify reduced motion and loading behaviour on a throttled phone connection.

Walk through search → collection filter → variable product → choose option → wishlist → add → bag quantity → coupon → checkout decline → retry success → confirmation → preview account order history. Also inspect empty wishlist/bag, no results, out of stock, unknown tracking ID, form validation and reset message.

This code delivery is complete within the revised **repository preview** scope, with the above limitations recorded. It is not a production or staging WooCommerce completion claim.
