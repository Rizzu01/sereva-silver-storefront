# WordPress / WooCommerce handover

## Current delivery

The client requested code for Vercel approval first. This repository is intentionally buildless HTML/CSS/JS. It does not install a new WordPress theme or change any existing store settings/data. The live source exposes Lamora and Elementor/WPBingo assets, but the active child theme, editor ownership and complete plugin/settings list still need admin verification after approval.

## Template mapping

| Preview component / route | WordPress implementation after approval |
| --- | --- |
| `header()`, `navChildren()`, `footer()` | Existing WP menu locations and `wp_nav_menu`; preserve desktop/mobile labels, reading order, parent taxonomy URLs and footer groups. Editable branding, approved social links and support details. |
| `home()` | Existing Elementor page or appropriate block template; editable hero, copy, category entries and featured-product queries. Keep merchandising out of hardcoded JS. |
| `collection()`, `filtersMarkup()`, `catalogResults()` | Existing theme archive integration / `archive-product.php` and product taxonomy templates. Native query/taxonomy, available attributes, price/stock filters, sorting and pagination. Avoid duplicate indexing or client-side inventory authority. |
| `productCard()` | Native WooCommerce product loop / `content-product.php`; render prices, currency, tax display and thumbnails through WC helpers. |
| `productPage()`, gallery, variation groups | Native single product hooks and gallery; WC variable-product form and variation data. Keep merchant size labels, stock notices, variation prices and availability. Port visual classes rather than duplicating inventory logic. |
| `addToBag()`, `bagLines()`, `totals()` | **Replace** local preview state with WooCommerce add-to-cart/cart/session. Validate quantity, stock, variation and price on the server. Never trust JS catalog prices. |
| Cart and checkout | Preserve the assigned Cart/Checkout pages and their existing block/classic mode. Style native blocks or shortcodes; let WC calculate coupons, shipping, tax, currency rounding and totals. Keep current gateway/courier plugins and guest settings. |
| Account routes | Native `[woocommerce_my_account]` or theme-supported account blocks. Native registration/login/logout/reset, nonces, server validation, endpoint permissions and password emails. Never migrate this preview account object as authentication. |
| Wishlist | Reuse the observed WPC Smart Wishlist integration after verifying its activation/settings. Preserve guest-vs-account behaviour and sync rules. |
| Order tracking | Native WooCommerce order tracking and existing courier/tracking integration. Validate order ownership/billing details; preview IDs have no production meaning. |
| Reviews | Native approved product comments/reviews and aggregate data. Do not present imported testimonials as new Sereva customer endorsements. |
| Our Story / Contact / Care / FAQ / policies / Journal | Existing WordPress content and editor; remove demo blocks, finalize Sereva legal/contact identity, retain approved URLs. Reuse the existing contact plugin and verified mail routing. |

## Porting the visual layer

`dist/style.css` contains the source tokens and component styles. Global reset and base element rules belong only in the storefront template/child-theme scope. Prefix component rules with a storefront wrapper where the active theme owns surrounding pages; do not paste the global stylesheet into the production Customizer without regression review. Use a child theme for classic-theme PHP/CSS changes, preserving parent updates. If the page is Elementor-owned, use editable page sections and a child-theme asset file for shared styling.

The JavaScript functions are grouped by templates, catalog discovery, product selection, cart, account and dialog/event handlers. Extract only the presentation behaviour that is still needed after native theme/plugin integration. Delete preview routing, local cart/totals, coupon simulation, fake account forms, payment simulation and local orders from the production bundle.

Local catalog snapshots are review data. The source IDs and paths are retained to map products; do not re-import them over production products or create duplicate SKUs. Use live WooCommerce objects and current media IDs. Imported photos in this repository are optimized derivatives; the original media library remains authoritative. Hero and editorial images require final client approval.

## Safe implementation sequence

1. After design approval, obtain a **staging copy** and backup. Record assigned shop/cart/checkout/account pages, active theme/child theme, editor, menu locations, attribute taxonomies, tax mode, guest/registration settings, shipping zones, gateway/courier/email integrations and cache exclusions.
2. Implement the visual layer on staging. Map existing products/categories and verified content; keep URLs and menu taxonomy. Apply no redirect until the redirect map is approved.
3. Connect native product forms, cart and account flows. Preserve all server nonces, notices, validation and authorization. Keep checkout/account/cart out of full-page caching as required by the installed setup.
4. Finalize missing images, the two flagged zero-price variations, Sereva business details, returns/FAQ inconsistencies and sizing chart. Check that no theme-demo/localhost/old-domain assets remain.
5. Use gateway **sandbox mode on staging** for both successful and failed purchases; verify shipping eligibility, coupons, tax totals, stock deduction, confirmation, email, order history, tracking and cancellation/refund behaviour where supported.
6. Deploy theme/content changes through the host workflow. Never overwrite the production customer/order database with an old staging database. Use an order-safe release strategy and preserve production settings/inventory.

## WordPress verification required before production

- Desktop keyboard-accessible mega menu; mobile expandable groups and parent categories.
- Real stock and every attribute combination, gallery zoom, size guide, wishlist and unavailable states.
- Guest checkout enabled/disabled exactly as currently configured; live tax/shipping/coupon calculation and INR rounding.
- Native signup, login, logout, lost-password email, expired/invalid reset token, account ownership, orders, address/profile saves and return to checkout.
- Successful and declined sandbox payment, retry, order-received page, emails and inventory changes. No live charge during testing.
- Screen-reader labels/notices, focus order, Escape/modal behaviour, contrast, 320/375/390/430px phone widths, tablet/desktop widths, image loading and mobile performance on the deployed environment.

Reference documentation: [WooCommerce templates](https://woocommerce.com/document/woocommerce-store-editing/templates/), [cart/checkout](https://woocommerce.com/document/woocommerce-store-editing/customizing-cart-and-checkout/), [native page shortcodes](https://woocommerce.com/document/woocommerce-shortcodes/page-shortcodes/).
