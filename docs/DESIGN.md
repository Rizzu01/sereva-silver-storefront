# Sereva design direction

Sereva replaces the JOHE name in the visible storefront. Existing brand colours and navigation paths remain the starting point. This is an original composition, not imported theme/demo source.

## Brand tokens

Extracted from the live Lamora custom styles and Elementor page/footer styles on 17 November 2026.

| Token | HEX | Evidence / use |
| --- | --- | --- |
| `--brand` | `#5E2316` | Live buttons, price/filter controls, announcement strip and custom theme rules; primary text/accent/footer. |
| `--blush` | `#E1BCAB` | Live Elementor/decorative styles; restrained accents and transparent surfaces. |
| `--black` | `#000000` | Live base text. |
| `--white` | `#FFFFFF` | Live backgrounds and inverse text. |
| `--grey` | `#7E7E84` | Live theme muted colour; reserved for nonessential decoration. Smaller body/meta copy uses darker neutral `#666` from live styles. |
| `--line` | `#EDEDED` | Live separators. |

Soft backgrounds are blends/transparencies of the sampled blush and white. Brown/white is approximately 12:1 contrast; black/white 21:1; #666/white about 5.7:1. Blush is decorative or paired with dark brown; not small text on white. Photography retains its original colours.

The serif and sans-serif were retained from the repository, with licence notices. Latin-subset WOFF files reduce combined font transfer from ~760 KB to ~47 KB. A serif fallback and system sans-serif remain available. The wordmark is live text for the review, not a claim of a final Sereva logo design.

## Research

| Reference | Observed pattern | Sereva decision |
| --- | --- | --- |
| [Alukas ThemeForest listing](https://themeforest.net/item/alukas-modern-jewelry-store-wordpress-theme/45256351) and [live demo](https://alukas.presslayouts.com/) | Category discovery, clear product names/prices, live search, wishlist and product variation features. Demo visually inspected in the browser. | Preserve a distinct category section; retain searchable product names and simple card hierarchy; use quieter navigation and less merchandising density. |
| [Goldish ThemeForest listing](https://themeforest.net/item/goldish-jewelry-store-woocommerce-theme/33978103), [demo index](https://parkofideas.com/goldish/) and [store demo](https://parkofideas.com/goldish/demo/) | Large close-up editorial photography; generous spacing; minimal header; documented mobile-first structure, product zoom/variation layouts. Browser imagery and responsive/tablet header observed. | One editorial hero; spacious gallery; compact mobile header; sticky mobile purchase action; expandable support details. |
| Pinterest: `luxury jewellery ecommerce website`, `editorial silver jewellery website`, `minimal jewellery product page` | All three requested searches were attempted through web search. Results did not expose useful site-design boards. Direct Pinterest search returned a site-served Access Denied page with a robot illustration; further browsing stopped. | **Research gap, not a completed Pinterest comparison.** No Pinterest image or design was copied. Revisit manually after preview approval if desired. |

A true phone-size comparison of the theme demos was not completed in the restricted browser. Desktop and responsive/tablet observations informed the design; phone layout and usability require the documented post-deployment review.

## Components

The shared CSS and vanilla JavaScript provide: announcement strip, centred wordmark/header, preserved mega/mobile navigation, product/category cards, editorial panels, collection toolbar/filter drawer, gallery/zoom/thumbnails, variation radios, quantity controls, wishlist, comparison table, bag drawer, order summary, checkout and account forms, FAQ disclosures, policy prose, empty/error states, toast, and preview disclosures.

Interactions use semantic buttons, links, labelled native controls, details/summary, native modal dialogs, focus-visible styles, a skip link, logical heading levels, live status text and reduced-motion rules. Native dialogs supply focus containment; browser verification remains outstanding.

## Photography and accuracy

[asset-provenance.csv](asset-provenance.csv) records every downloaded product photo and five editorial sources. 288 product images are stored locally as optimized WebP; missing images have an explicit placeholder. Additional gallery photographs remain linked to their original public media URLs. No original-store logo, watermark-heavy banner or contact destination was repurposed as a Sereva identity.

The existing repository’s illustrative hero is retained for this private design review. Its final licence/client approval is not established by its presence in the repository. Replace it with approved Sereva campaign photography before a commercial launch. Product details/prices/stock are a point-in-time source snapshot, not live inventory.
