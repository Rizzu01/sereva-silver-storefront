# Sereva Silver storefront concept

An independent fictional brand demo by Creative Rizz. The static site uses HTML, CSS, and JavaScript. All product imagery and sample prices are illustrative.

## Run locally

Run `python3 -m http.server 8000 --directory dist` from this folder, then open http://localhost:8000. The demo includes responsive menus, collection filters, search, a local wishlist, and a local shopping bag. Account and checkout screens demonstrate the flow without collecting credentials or taking payment.

## WordPress and WooCommerce implementation

1. **Start on staging.** Back up the database and files. Identify the active WordPress theme, its editor, current cart and checkout configuration, and payment/shipping plugins. Record a baseline order before changing anything.
2. **Rebuild the visual layer in the current theme.** Port the layout and design tokens in `dist/style.css`, scoping the CSS to the new storefront sections. Use the Site Editor and WooCommerce templates with block themes. With a classic theme or a builder, use that editor for editable sections and a child theme for code changes. Use approved client artwork and product photography.
3. **Map the navigation to existing pages.** Keep the current menu labels and hierarchy. Point Store, Women, Men, New Arrivals and seasonal entries to the matching live WooCommerce pages or product categories. Preserve existing URLs when possible. Render real products and prices from the store catalog rather than the demo list in `dist/store.js`.
4. **Connect shopping to WooCommerce.** Use WooCommerce products, variations, stock and native add-to-cart. Replace the browser-only demo bag and wishlist with the store’s cart and existing wishlist solution where available. Keep the existing cart, checkout, payment and shipping setup until compatibility is verified. Test INR prices, tax rounding and PIN-code shipping with the existing providers.
5. **Use the native My Account page.** Link the header account icon to the assigned WooCommerce My Account page. Use its existing account page content or the `[woocommerce_my_account]` shortcode. Set registration and guest checkout under WooCommerce → Settings → Accounts & Privacy. Test login, registration, reset email and customer order visibility with test accounts.
6. **Validate before release.** Test menus on desktop and phone, product variations, add-to-cart, guest checkout, a successful and a failed payment in sandbox mode, and order/dispatch emails. Verify policy, contact and tracking links. Publish theme and content changes using the host’s deployment workflow, preserving production orders and inventory.

### References

- [WooCommerce store templates](https://woocommerce.com/document/woocommerce-store-editing/templates/)
- [WooCommerce cart and checkout](https://woocommerce.com/document/woocommerce-store-editing/customizing-cart-and-checkout/)
- [WooCommerce My Account and page shortcodes](https://woocommerce.com/document/woocommerce-shortcodes/page-shortcodes/)
