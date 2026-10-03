# Watergate: Waterwal water filter landing page (Greek)

A static, single-page site (HTML + CSS + vanilla JS, no build step) that presents **Waterwal** water-filtration solutions organized by need: homes, coffee shops, restaurants/hotels and offices. It is **not an e-shop**. Every call to action leads to a request for free advice or a quote.

## Structure

| File | Purpose |
|---|---|
| `index.html` | The landing page: hero, solutions by need, products (filterable by type of space), what the filters remove, comparison table, savings calculator, how it works, FAQ, about, contact form |
| `privacy.html` | GDPR privacy-policy **template** (have it reviewed before launch) |
| `404.html` | Error page |
| `css/styles.css` | Mobile-first styles (`min-width` breakpoints at 600 / 900 / 1100 px) |
| `js/main.js` | Mobile menu, product filter, calculator, contact form |
| `assets/` | Self-hosted fonts, favicon/app icons, `og-image.jpg` (1200×630, ~45 KB) |
| `robots.txt`, `sitemap.xml`, `llms.txt` | SEO / GEO |
| `_headers` | Security & cache headers for **Netlify / Cloudflare Pages** |
| `.htaccess` | Security, HTTPS redirect, compression & cache for **Apache / cPanel** hosting |
| `site.webmanifest` | Icons and theme colour for mobile devices |

To preview locally: `python3 -m http.server 8000`, then open http://localhost:8000.

## Before going live (required)

Every placeholder is marked with `TODO`, `[...]`, `XXX`, `example.gr` or `example.com`:

```sh
grep -rn "TODO\|example\.gr\|example\.com\|XXX\|6900000000\|\[Επωνυμία\|\[Περιοχή\|YOUR_FORM_ID" --include=*.html --include=*.txt --include=*.xml --include=.htaccess .
```

1. **Domain**: replace `https://www.example.gr/` everywhere: canonical, Open Graph, JSON-LD, `sitemap.xml`, `robots.txt`, `llms.txt`. If the domain has no `www`, also change the redirect in `.htaccess`.
2. **Business details**: legal name, VAT number (ΑΦΜ), GEMI number, address, phone numbers, email. They appear in the contact section, footer, JSON-LD, `llms.txt` and `privacy.html`. Use **exactly the same** details everywhere and in your Google Business Profile; consistent NAP (name, address, phone) matters for local SEO.
3. **Business name / logo**: "Watergate" is a working name taken from the repo name. Replace it if you are using a different one.
4. **Viber / WhatsApp**: replace `306900000000` with your mobile number. It appears in the contact section and in the mobile action bar.
   - The WhatsApp link (`https://wa.me/30…`) needs the country code with no `+`, spaces or leading zeros. It opens a chat with a pre-filled Greek message; edit the `text=` part to change it.
   - The Viber link (`viber://chat?number=%2B30…`) opens a chat only if the visitor has Viber installed, on a phone or Viber Desktop. Without Viber, the link does nothing. The number must have an active Viber account.
5. **Contact form**: create a free form at [formspree.io](https://formspree.io) and replace `YOUR_FORM_ID` in `index.html`. Until then, the form opens the visitor's email app with the message pre-filled. If you switch to another provider, update `connect-src` / `form-action` in the CSP (three places: `index.html`, `_headers`, `.htaccess`).
6. **Product information**: model names, features, the list of what the filters remove, and the replacement interval (6 months / 3,600–5,000 litres) came from public listings. **Verify them against the official Waterwal catalogue.** If Waterwal makes dedicated HoReCa / espresso-machine models, add them to the "Καφέ" (coffee shops) section.
7. **Product photos**: the products currently use illustrations. If you get photos from Waterwal (with permission to use them), see "Photos" below.
8. **Privacy policy**: fill in the template and have a lawyer or accountant review it.

## SEO

- Unique `title` and `description`, `canonical`, `hreflang="el-GR"`, `robots` meta, semantic HTML (a single `h1`, `h2` per section, `article`, `nav`, `address`).
- **Schema.org JSON-LD**: `LocalBusiness` (with `brand: Waterwal` and an `OfferCatalog` of products, no prices), `WebSite`, `WebPage`, `FAQPage`. Check it with the [Rich Results Test](https://search.google.com/test/rich-results) and [validator.schema.org](https://validator.schema.org) once the site is live.
  - Note: Google currently shows FAQ rich results only for government and health sites. The markup still helps search engines and AI tools understand the page.
  - If you edit an FAQ answer, also update the matching JSON-LD (there is a comment marking it).
- `sitemap.xml` and `robots.txt`. After launch, submit the sitemap to **Google Search Console** and **Bing Webmaster Tools**. Bing also powers several AI search tools.
- **Lighthouse** (local test): Mobile: Performance 99, Accessibility 100, Best Practices 100, SEO 100. Desktop: 100 / 100 / 100 / 100.

## GEO (Generative Engine Optimization and local search)

"GEO" is read here in both senses:

- **AI search** (ChatGPT, Perplexity, Gemini, Claude):
  - Clear, factual, self-contained wording: "need → recommended solution" and question-and-answer content.
  - Structured data.
  - `robots.txt` explicitly allows the AI crawlers. Change it if you don't want that.
  - `llms.txt` gives a short summary of the business.
  - **Honest caveat**: `llms.txt` is a proposed standard. There is no reliable evidence that the major AI search tools use it. It costs nothing, but don't expect much from it.
- **Local search**:
  - `LocalBusiness` with an address and `areaServed`.
  - An "About us" section stating where you work.
  - The biggest factor, which this code can't do for you: a **Google Business Profile** with the same details, and real reviews from customers.

## Security

- **Content Security Policy**: only resources from the site itself, with no inline scripts or styles; the one exception is Formspree for the form. It is set both as a `<meta>` tag and as an HTTP header (`_headers` / `.htaccess`, which also add `frame-ancestors 'none'`).
- HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`.
- **No third parties**: fonts are self-hosted (SIL Open Font License), and there are no analytics or cookies. That means no cookie banner is needed, and it avoids the GDPR problem with Google Fonts (LG München, 2022).
- The form has a honeypot against bots, field length limits, and a required consent checkbox.
- A static site has no database or server-side code, so it has a very small attack surface.
- Check the headers after launch at [securityheaders.com](https://securityheaders.com).
- **GitHub Pages cannot set HTTP headers**, so only the `<meta>` CSP applies there. For full security, prefer Netlify, Cloudflare Pages or Apache hosting.
- If you add Google Analytics, a Facebook Pixel, Google Maps and so on, you must widen the CSP **and** add a cookie consent mechanism.

## Open Graph image

`assets/og-image.jpg`: 1200×630, progressive JPEG, ~45 KB, metadata stripped. Facebook, Viber, WhatsApp, LinkedIn and X all accept this format.

After launch, check how links preview in the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/). It also clears the cache when you change the image.

## Photos (when you add real product photos)

Recommended approach:

```html
<picture>
  <source srcset="assets/products/undersink-400.avif 400w, assets/products/undersink-800.avif 800w" type="image/avif">
  <source srcset="assets/products/undersink-400.webp 400w, assets/products/undersink-800.webp 800w" type="image/webp">
  <img src="assets/products/undersink-800.jpg" alt="Φίλτρο νερού κάτω πάγκου 2 σταδίων Waterwal με βρυσάκι"
       width="800" height="600" loading="lazy" decoding="async"
       sizes="(min-width:1100px) 360px, (min-width:600px) 45vw, 100vw">
</picture>
```

- Always set `width`/`height` (prevents layout shift), use `loading="lazy"` below the fold, and write descriptive Greek `alt` text.
- Compress with [Squoosh](https://squoosh.app) or `cwebp` / `avifenc`. Aim for < 100 KB per photo.
- Use descriptive file names (`filtro-kato-pagkou-waterwal.jpg`), not `IMG_1234.jpg`.

## Hosting

Any static host works:

| Host | Notes |
|---|---|
| Netlify / Cloudflare Pages | Free; reads `_headers` automatically. **Recommended.** |
| Greek shared hosting (Apache / cPanel) | Upload the files; `.htaccess` applies automatically |
| GitHub Pages | Free, but no custom headers (see Security) |
