# Agro Engineering Solutions

A static Next.js App Router corporate website, built with TypeScript, Tailwind CSS, Lucide icons, locally hosted Manrope, and responsive Next Image components. It contains no database, CRM, authentication, enquiry form, tracking pixel, or analytics. The Sites review deployment has platform access control; the application itself has no login.

## Local development

Requires Node.js 20.9+ and npm. Python 3 is used only for the local static preview and test server.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. To inspect the exact static production output:

```sh
npm run build
npm start
```

If that port is busy, use `npm run dev -- --port 3100`, or `python3 -m http.server 3100 --bind 127.0.0.1 --directory out`.

## Project map

- `lib/business.ts`: all business details, approval flags, photos and product portfolio.
- `components/Header.tsx`: sticky desktop and mobile navigation, Escape dismissal.
- `components/Website.tsx`: reusable Hero, About, ProductGrid, InfrastructureGallery, WhyChooseUs, Contact and Footer components.
- `app/page.tsx`: ordered single-page marketing experience.
- `app/globals.css`: responsive visual system, reduced motion and keyboard focus states.
- `app/layout.tsx`: metadata, favicon, draft status and verified Organization JSON-LD.
- `app/privacy-policy/` and `app/terms-of-use/`: separate owner-review legal drafts.
- `app/robots.ts`, `app/sitemap.ts`: static crawler files, gated by release readiness.
- `public/images/`: unchanged official logo, compressed real product photos, facility video stills, and responsive variants.
- `docs/ASSET-SOURCES.md`: image provenance and usage review notes.
- `scripts/prepare-images.mjs`: regenerates static WebP variants.
- `scripts/check-release.mjs`: business-data release check.
- `tests/site.spec.ts`, `playwright.config.ts`: browser checks against static export.
- `.openai/hosting.json`: registered Sites identity and static output directory.

## Confirmed by the owner

Legal and trade name: Agro Engineering Solutions.

Address: Building No C10, Shree Balaji Complex, Bhatale, Bhiwandi, Vehele, Maharashtra 421302, India.

Email: sales@agroparts.in. Phone: +91 89760 91112.

These values were provided in chat. Document consistency still needs owner review. Do not infer a production domain or WhatsApp registration from an email address or phone number.

## Before public launch

1. Confirm the exact production HTTPS origin and set `business.domain`, for example the actual owned origin without a trailing slash. There is deliberately no guessed domain.
2. Check identity/address/phone/email against the submitted legal documents and Meta Business Portfolio.
3. Approve the proposed marketing copy, pictured product category names, and rights to publish all imagery. Images show supplied components; they do not establish current stock or compatibility.
4. Review both legal drafts. Confirm the final hosting provider, enquiry processing, necessary service providers, retention periods and effective date. Replace review notes and outstanding factual gaps with approved statements.
5. Set `business.ownerApproved` and `business.legalApproved` to `true` only after completing those reviews.
6. Optionally confirm WhatsApp registration, a Google Maps URL, hours, GSTIN for public display and official social URLs. Blank optional fields are omitted. They do not block release.
7. Run `npm run check:release`, `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run test:browser`.
8. Publish the resulting `out/` directory to a public HTTPS static host, connect the owned domain and verify all public routes without logging in.
9. Check generated canonical URLs, sitemap, Organization data, mobile calls/email, and crawler access on the actual production domain.

Until approval is complete, pages carry a visible development banner, `noindex,nofollow`, a robots disallow rule, an empty sitemap, and no Organization JSON-LD. This protects against presenting an incomplete business profile as final. The business-data checker intentionally exits nonzero while domain and approvals are missing. Do not submit a private review URL for Meta verification.

## Deployment

This repository uses `output: 'export'` and produces `out/`. It needs no runtime server, secrets, paid service, or image optimization API. For Cloudflare Pages or another static host: use Node 20.9+, install with `npm ci`, build with `npm run build`, and select `out` as the output directory. Configure HTTPS, the owned domain, and directory-index routing for `/privacy-policy/` and `/terms-of-use/`; use the exported `404.html` for missing pages. No SPA catch-all rewrite is required. All `out/_next`, image variants and font files must be deployed together.

Sites review hosting uses `.openai/hosting.json`. Preserve its project ID on future edits. A private review deployment is separate from approval for the final public business domain.

## Images and performance

Real photographs are precompressed WebP, with static widths selected by `next/image`. Products use `contain` to preserve all visible components; facility photographs use editorial cropping. Source originals remain unchanged on the Desktop. Hero loading is prioritised, other images use lazy loading, and panels reserve their layout space. No external fonts or animation runtime is downloaded. Run `npm run images` after replacing a base WebP file, before building.

## Validation

```sh
npm run lint
npm run typecheck
npm run build
npm run test:browser
npm run check:release
```

Browser tests use the installed macOS Chrome by default. Set `CHROME_PATH` to an installed Chrome executable on other systems. Tests check 320/390/768/1440 pixel layouts, image decoding, horizontal overflow, mobile navigation including Escape dismissal, legal routes, verified call/email links, and draft crawler controls. Screenshots are saved under `test-results/` (ignored by Git). No Core Web Vitals score is claimed; measure field performance after deployment.

## Verification readiness

- Implemented: visible business identity and supplied contact/address, real offering imagery, actual premises imagery, accessible legal routes, responsive public application routes, semantic markup, and configured SEO generation.
- Pending: final domain/ownership and HTTPS public deployment, business-document consistency, product/copy/image approval, final legal review, optional WhatsApp confirmation.
- A website cannot guarantee Meta approval. There is no Meta Verified badge or approval claim.
