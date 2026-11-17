# Source audit and delivery boundary

Audited 17 November 2026. The client subsequently specified **GitHub code for Vercel review first; WordPress implementation only after design approval**. No staging credentials were supplied or needed for this delivery. No production database, customer, order, gateway, shipping or account setting was changed.

## Inventory

[page-feature-map.csv](page-feature-map.csv) and [route-inventory.json](route-inventory.json) contain 3,382 discovered/current or required endpoint entries with current URL, planned path, template, functionality, source verification, frontend verification and WordPress status. They distinguish an inventoried URL from a browser-verified page. No new production redirects have been applied.

- 304 products from the public WooCommerce Store API; 177 simple, 127 variable.
- 240 individual variations fetched with price and availability. 275 parents in stock and 29 out of stock at capture time.
- 14 category URLs in the native sitemap; 13 have catalog products. Uncategorized intentionally displays an empty state.
- 2,978 product tag URLs from the product taxonomy data. Tag archives use one reusable collection template; individual tag HTTP/UI checks have not been performed.
- 26 WordPress pages and 8 posts from public WordPress endpoints, plus menus, footer links, archive, pagination and customer endpoints.
- 55 non-product source URLs retrieved over HTTP. Homepage, shop and an Onyx Line product page inspected in the Cloud browser, including desktop and responsive/tablet header states. A true phone viewport and touch interactions remain unverified.
- 16 catalog products have no published image. The preview uses a labelled photograph-pending SVG; their IDs and URLs are in [missing-product-images.json](missing-product-images.json).

## Discovery sources

- https://johe.in/ and the rendered header, desktop/mobile menus, footer and internal links.
- https://johe.in/robots.txt identifies https://johe.in/wp-sitemap.xml . The alternative `/sitemap_index.xml` returned 404.
- Native page, post, product, category, tag, footer/template and author sitemaps. `wp-sitemap-taxonomies-product_tag-2.xml` returned 404. The Store API exposed additional tags beyond the first 2,000 sitemap entries; the union is retained in the map.
- `/wp-json/wc/store/v1/products?per_page=100&page=1..4`, individual product/variation records, public product reviews, `/wp-json/wp/v2/pages` and `/wp-json/wp/v2/posts`.

## Preserved navigation

Desktop: **Home → Diwali Edit → Store → About Us → Contact**. Store contains **New Arrivals**, **Men** (Brooches, Chains, Rings, Bracelets & Kadas), then **Women** (Pendants & Pendant Sets, Rings, Earrings, Bracelets & Kadas, Chains). The new mega menu retains this reading order and original paths, with a supplementary Shop all products entry.

Mobile: **Home → Diwali Edit → New Arrivals → Women → Men → Shop All → About Us → Contact**. Women retains the observed mobile order: Pendants & Pendant Sets, Bracelets & Kadas, Earrings, Rings, Chains. Men retains Brooches, Chains, Rings, Bracelets & Kadas. Gender headings expand; a supplemental Shop all link inside each group makes the parent archive accessible.

Footer: **Information** retains Privacy Policy, Refund Policy, Terms & Conditions. **About Us** retains Our Story, Jewellery Care, Contact Us. Supplementary account, tracking, wishlist, FAQ, journal and comparison links sit in a separate Your Sereva group. Original social destinations have not been relabelled as Sereva accounts.

## Findings requiring approval

| Finding | Evidence / current treatment |
| --- | --- |
| Malformed promotional destinations | Homepage links point to `https://johe.koyeldesign.comshop/`. No equivalent campaign meaning is assumed; these links are absent from new promotion cards. Candidate replacement recorded in redirect map, not applied. |
| Broken product return links | `/refund_returns/` and `/refund_returns-2/` both returned 404; canonical footer uses `/refund-returns/`. New product guidance uses the verified canonical policy. No production URL redirect. |
| Duplicated shop/account/cart/wishlist pages | `shop-2`, `my-account-2`, `cart-2`, `checkout-2`, `wishlist-2` are preserved frontend aliases. Canonical assignment must be confirmed in WooCommerce. |
| Vendor endpoints | `/dashboard/` and `/my-orders/` contain Dokan shortcodes. Client must confirm vendor vs customer intent before WordPress migration. Preview uses customer-account layouts. |
| Empty/demo/internal pages | Sample Page, maintenance/new-page, four post-format examples, footer previews and Elementor template expose draft or internal content. Each remains an inventoried blocker/hold; no claim of approved content coverage. |
| Conflicting policy/FAQ statements | FAQ mentions store credit/exchanges and a 24-hour damage notice; dedicated returns policy provides refunds/one exchange within 5 days and exclusions. Dedicated policy guides product summaries, with conflict explicitly flagged in FAQ. Merchant approval required. |
| Unedited care content | Jewellery Care includes repeated blocks and placeholder payment/return answers. Preview uses only verified care guidance; placeholder answers removed. |
| Source branding leakage | Live sticky logo references a Lamora demo asset, sign-in image references localhost, promotional links use an old design domain. Preview ships local assets and Sereva wordmark. |
| Missing product imagery | 16 products remain catalog-visible with a clear placeholder. No invented product image assigned. |
| Size conversion chart | Original option labels include India/US sizes, but no approved conversion chart was found. Size help is measurement guidance only. |
| Business identity | Original support email/phone/social accounts are not presented as Sereva contacts. Policy identity/contact placeholders must be replaced with approved business details. |

## Implementation observations

The live source includes the **Lamora** theme, WooCommerce, Elementor, WPBingo, WPC Smart Wishlist, variation-display assets, Contact Form 7/Fluent Forms assets, GST-related styles and cache/minification plugins. Assets establish presence, **not the complete active plugin list or settings**. Editor/template ownership, exact versions, custom hooks, gateway configuration, tax inclusion and shipping zones cannot be verified from public HTML.

No live customer registration, password reset, cart mutation, payment or purchase was performed. Source account forms are inventoried, not verified as working. Real WooCommerce flow verification is deferred by the client’s revised delivery scope.

## Browser verification blocker

The managed `sites-preview` service failed with `relay could not open browser port 4173: timed out waiting for relay readiness`. The initial preview command also exposed a port-argument mismatch in the local server; that code issue was fixed. The subsequent failure is the preview relay. Per the environment workflow, no alternative browser tunnel or server was substituted. New-build screenshot/layout/keyboard/mobile-performance checks remain unverified. Meaningful DOM integration and all product-route assertions pass; see [VERIFICATION.md](VERIFICATION.md).
