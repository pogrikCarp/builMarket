# Mobile catalog interface QA

Date: 2026-10-29 (Europe/Moscow).

## Scope and visual target

Only the catalog interface below 768 CSS px changes. The desktop catalog is copied from commit `869e7b0` without behavior or markup changes; only its component and exported type names differ. Product detail pages, the shared header, other pages, database records, API routes, synchronization, and catalog fetch functions are outside the change.

Reference: the user-provided Petrovich catalog-menu screenshot and `https://petrovich.ru/`. The reference supplies the category/subcategory hierarchy and separation of category browsing from product results. DomStroy branding and existing product cards are retained.

The reference website served its desktop interface at a 390 px viewport, including after a reload. Its actual phone-specific interface could not be captured in this browser. This is a phone adaptation of the supplied hierarchy; pixel fidelity to Petrovich's phone interface is not claimed.

## Evidence

Screenshot directory: `C:/Users/user/.codex/visualizations/2026/10/28/01a182dd-b0fa-7b42-a82b-5aa02569966f/`.

- Source visual truth: `catalog-reference-desktop.png`, 1440 × 900 pixels, requested CSS viewport 1440 × 900.
- Initial mobile catalog: `catalog-before-mobile.png`.
- Mobile implementation: `catalog-mobile-final-local.png`, 390 × 845 pixels, requested CSS viewport 390 × 844. The one-pixel height difference is browser capture rounding; no image rescaling was used.
- Preserved desktop: `catalog-desktop-preserved.png`, 1426 × 891 pixels in the browser capture, requested CSS viewport 1440 × 900. The viewport content width was approximately 1426 CSS px with its scrollbar; this capture is used for layout preservation, not pixel matching to the external reference.
- Clean production-build phone view: `catalog-mobile-production.png`, 390 × 845 pixels for a requested 390 × 844 CSS viewport.
- Production-build phone filters: `catalog-mobile-filter-production.png`, 376 × 814 pixels at the browser's captured content scale; dialog bounds were separately checked against the CSS viewport.
- Live deployment verification is performed separately after this pre-deployment design check.

The reference and implementation full views were opened together for structural comparison. Category labels differ because the real DomStroy categories are preserved. A focused crop was unnecessary: the phone full view clearly shows the search, category rows, touch targets, and viewport edges.

## Comparison history

1. The initial implementation applied the reference structure to both widths. Following the user's scope clarification, desktop was restored to its original implementation and all new navigation and filter presentation was isolated below 768 px.
2. Small secondary navigation text was darkened, and phone back/close actions were enlarged to 44 px. The resulting phone layout was captured again; category names wrap without clipping.
3. Boundary checks confirmed that only one catalog implementation is mounted. A phone filter dialog unmounts and restores body scrolling when switching to desktop width.

## Findings

No remaining actionable P0/P1/P2 findings were found. The clean production build was inspected in a fresh browser tab with no browser console errors. Desktop remained the original implementation, while the phone hierarchy and native filter dialog worked as intended.

## Verification

- Widths 320, 390, 430, and 767 px: new phone interface; no content overflow beyond the main container.
- Widths 768, 1024, and 1440 px: original desktop interface; original heading, rounded frame, sidebar tree, filters, and product list retained.
- Category → subcategory → product results; return to all categories; all products; empty promotions.
- Price range, in-stock filter, sorting, applying/clearing filters, empty results, and global search by product code.
- Product detail → browser Back restores category, price range, stock filter, and sorting on a clean page load.
- The mobile all-products view is represented by `view=products`, preserving the list when returning from a product. This is a presentation parameter; database query options are unchanged.
- Native dialog closes with its close button, result button, and Escape; body scrolling is restored.
- Clean production build: category selection, stock filtering (9 → 6 products), filter reset, code search (one result), cart add/remove, favorite add/remove, product/back, and pagination (items 51–100) passed. Switching at 768 px retained the old desktop frame and unmounted phone controls; switching back retained page 2.
- `npm run lint` and `npm run build` passed.
- Catalog fetch functions were compared verbatim against `869e7b0` in both implementations and match.
- Full local product/category data hash before and after UI checks: `81b85160dc1d236838344da1d4a996efa28c347e83f0a60d782c1771e8d47819` (723 products, 56 folders), unchanged.

## Open questions and follow-up

The external reference's actual phone UI remains an unverified reference state. No database or product content edits are needed for this interface change.

## Implementation checklist

- [x] Isolate new interface to phones.
- [x] Preserve desktop and catalog requests.
- [x] Verify navigation, filtering, and responsive boundaries.
- [x] Verify final production build and browser console.

final result: passed
