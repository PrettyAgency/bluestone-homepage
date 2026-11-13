BlueStone Landscape homepage preview (standalone)

Open index.html in a browser. No build step, no dependencies.

index.html   Semantic markup, one H1, JSON-LD LocalBusiness schema, meta title/description/canonical
css/styles.css  All styles, scoped under .bs (safe to enqueue on the WP front page only)
js/main.js   Mobile menu, quote form validation + simulated submit, before/after slider,
             gallery filter, dataLayer events, footer year, header scroll fallback
assets/      Logo, credential logos and project photos from the current BlueStone gallery,
             plus contours.svg (decorative linework)

Before production:
- Wire the form to the existing WordPress form plugin (the submit is simulated) and add reCAPTCHA v3 or Turnstile.
- Convert photos to WebP/AVIF at the sizes in the strategy doc and self-host the fonts.
- Replace placeholders marked in amber (suburbs, reviews, VBA number, ABN, address).
