# Product photography workflow — local, approval-gated pilot

This workflow is scoped to the Desktop website folder. No deployment commands are included. It never edits the Desktop content library or the existing logo. Existing website references remain unchanged until explicit image approval.

## What actually ran

Four built-in `image_gen` reference-based calls: gear assembly, clutch component, recoil starters, and one conservative clutch retry. Original reference images were inspected first. Exact prompts and returned image locations are recorded under `reports/product-image-audit/pilot/session.json`; all outputs were copied into this project. No external API key was used. The built-in tool exposes no per-call currency estimate, token usage or billing data; there is no defensible monetary total to report.

All generated candidates fail strict product/branding approval. Stronger lighting alone does not make them safe sales imagery. Rejected candidates are outside `public/`. No full-catalog calls were run.

## Inventory and original protection

```sh
node scripts/product-photography/audit.mjs --dry-run
PHOTO_CONCURRENCY=2 node scripts/product-photography/audit.mjs
```

The source defaults to `/Users/jashjain/Desktop/agro/Agro Content`; override using `--source=/absolute/folder`. It backs up all still-photo candidates using original filename plus SHA-256 suffix, verifies byte hashes, preserves modification times, and records dimensions, references, exact duplicates, and perceptual near-duplicate candidates. Videos, hidden metadata, documents, branding assets and facility images are excluded from product retouching. It inventories local website references separately. Perceptual hashes do not prove identical products. A resumable checkpoint avoids unnecessary conversion on later runs. macOS `sips` is used for HEIC conversion; it must have permission to decode the files, otherwise audit errors are reported rather than replaced with black placeholders.

Concurrency is bounded to 1–4 independent file jobs; atomic checkpoints are serialized. No paid calls occur in this script. The local originals backup may be several hundred MB; keep it out of public hosting and Git packages.

## Generation and spending controls

Use the built-in image tool in the conversation. A reference edit is one native call per asset, not a shell command calling a paid API. The native tool manages service execution; configurable API concurrency, HTTP rate-limit controls and API exponential-backoff cannot be implemented from this tool's interface. Do not claim otherwise. Three pilot assets plus one retry were used; stop further calls until the pilot direction is approved. There is no automatic paid full-catalog runner or hidden API fallback. If a separately metered API is desired later, it requires an explicitly approved integration, model, budget and credentials supplied locally. Never put keys in reports or source.

Review the returned native image, preserve its original output, and register its file and prompt in a new session/run. Do not overwrite an existing candidate with a different result. The session manifest is the restart checkpoint: completed native calls must not be rerun merely to regenerate web derivatives.

## Preview variants and QA

```sh
node scripts/product-photography/pilot.mjs --dry-run
node scripts/product-photography/pilot.mjs --test
```

This produces an original-versus-AI-versus-conservative comparison gallery, PNG masters, WebP square cards/mobile cards/thumbnails, and explicit QA failures. Conservative photographic alternatives apply mild linear exposure and sharpening to the actual photographed pixels; their geometry and original printed content are not regenerated. These alternatives preserve the foam background and may not meet the studio or empty-space brief. They require review too. Landscape conservative previews are available where the actual composition supports them. A tall clutch stack cannot be made into a tightly filled landscape frame without new photography, pixel-preserving compositing, cropping components, or excess side space; it is blocked rather than silently padded. There are no approved landscape AI outputs.

QA checks validity, dimensions, blank/corrupt outputs, hashes, output duplicates, source preservation, unchanged website mappings, and integration gates. Manually inspect geometry, text, realistic materials, clipping, subject presence, breathing room, card fit, and visual consistency. Automated similarity does not establish engineering accuracy. No unsupported 9/10 quality score is assigned. Previews are explicitly labeled unapproved.

The small filesystem retry helper retries only transient IO failures with bounded exponential backoff. It does not pretend to retry model API failures. Native generation failures must be logged in the session and reviewed before another call.

## Open the review gallery

Open `reports/product-image-audit/index.html` directly, or run:

```sh
python3 -m http.server 3121 --bind 127.0.0.1 --directory reports/product-image-audit
```

Then open http://127.0.0.1:3121. This server is local review only; it is not a deployment.

## Approval, integration and rollback

`pilot/decisions.json` defaults to no approvals. Only after the owner reviews a concrete candidate may the corresponding approval evidence and geometry, branding and website-fit checks be recorded. A rejected AI output cannot be integrated by simply setting an approval flag; repair it and review a new candidate instead.

```sh
node scripts/product-photography/integrate.mjs --dry-run
# AFTER explicit owner approval, not performed during this pilot:
node scripts/product-photography/integrate.mjs --apply
npm run lint
npm run typecheck
npm run build
npm run test:browser
```

Integration creates collision-resistant asset filenames and responsive variants, changes only selected photo mappings, and saves exact before/after configuration. Existing descriptions, routes, business facts and SEO remain intact. The rollback refuses to overwrite subsequent unrelated config edits:

```sh
node scripts/product-photography/rollback.mjs          # dry run
node scripts/product-photography/rollback.mjs --apply # only when requested
```

Do not use the existing Sites hosting tools or deploy as part of this workflow.

## Full-library approval and strict wording preservation

The owner subsequently approved the AI studio look, selected **Full product library**, and required that **no wording change on packaging or anything else**. The initial AI edits remain valid style references, but any reconstructed lettering is not suitable for literal product labeling. The full-catalog method therefore changes:

1. A single empty neutral studio backdrop was generated with the built-in image tool. Its image and exact prompt are in `assets/studio-backgrounds/`.
2. Native Apple Vision extracts foreground masks and records read-only original text locations from each real photograph.
3. Actual source RGB is copied into foreground layers; no model regenerates the products, logos, numbers, words or box artwork. No OCR string is written into any image.
4. The text-lock pass makes complete original photographed text regions opaque, protecting printed glyphs from matting-edge clipping. It does not correct spelling or numbers.
5. Foregrounds are proportionally scaled, arranged where separate masks support it, and composited onto the studio backdrop with restrained ground shadows. Touching components keep their original arrangement. No perspective warping or stretching is used.
6. Per-image manifests record masks, original text locations, unchanged-source hashes, foreground RGB-copy checks, framing and review flags. Read-only OCR can miss blurred text, and automatic masks can miss fine edges; these limitations remain visible rather than being called verified.

A packing/operations still (`IMG_5759`) is excluded from product transformations. There are 128 protected still-photo backups, **127 product-photo candidates**, and 72 video files. Multiple source angles of the same item are retained, not claimed to be distinct products.

### Execute or resume the approved batch

Requires the macOS Vision framework and the existing Xcode command-line tools. No extra package install, external API key or paid batch service is used.

```sh
swiftc scripts/product-photography/native/foreground.swift -o /tmp/agro-foreground
node scripts/product-photography/catalog.mjs --dry-run
PHOTO_CONCURRENCY=2 node scripts/product-photography/catalog.mjs
# Wait for the above to finish before locking text or writing the final gallery.
PHOTO_CONCURRENCY=2 node scripts/product-photography/lock-catalog-text.mjs
node scripts/product-photography/catalog-gallery.mjs
```

The native batch has configurable 1–3 job concurrency, bounded retry/backoff, per-item errors, content hashes and atomic checkpoints. It resumes completed work without new image-generation calls. `--limit=3` is a small native-processing test; `--force` regenerates masks and outputs. Never run two catalog writers simultaneously. The text-lock finalizer is separately resumable and must run only after the catalog batch completes.

All output lives under `reports/product-image-audit/catalog/`, outside `public/`. Each successful photograph has a native-aspect PNG master, a 2048-square PNG master, 1200-square WebP card, 1536 × 1024 WebP landscape, 768-square mobile image and 320-square thumbnail. A narrow or unusually wide subject may still have weak square fit; no real part is cropped or distorted merely to fill a square. Prefer the native-aspect master or choose a better source angle for those flags. Original source clipping cannot be repaired truthfully without another source image.

Open `reports/product-image-audit/catalog.html` or http://127.0.0.1:3121/catalog.html while the local review server runs. Every result has original-versus-studio links, individual download variants, original text trace data and review status. The full-catalog approval authorized processing; individual images are still review candidates and do not automatically replace the website's six selected product images. Website business facts, routing, design and existing media mappings remain unchanged. Nothing is deployed.

### Existing preferred AI pilot

The earlier three full-reference AI edits and one clutch retry are preserved. The gallery labels them as the **owner-preferred studio direction**, with separate technical notes about altered print/geometry. Those notes do not reject the chosen visual style. The full catalog's photographic foreground method addresses the later strict wording requirement without asking the image model to recreate labels.

### Small-accessory repairs and final validation

The full contact-sheet review identified 16 images where the global mask missed a small hose, shaft, cap/filter/nozzle, retaining pins or silver rings. `repair-accessories.mjs` adds focused original-source masks using explicit, reviewed crop recipes; it does not synthesize replacement components. It preserves the original photographed identification labels where relevant. The retaining-pin square/landscape layout is tightened by repositioning those original photographic layers. All raw pre-repair masks are retained for comparison.

After native catalog generation, run the repair pass **before** final text locking:

```sh
node scripts/product-photography/repair-accessories.mjs
PHOTO_CONCURRENCY=2 node scripts/product-photography/lock-catalog-text.mjs
node scripts/product-photography/validate-catalog.mjs
node scripts/product-photography/catalog-gallery.mjs
node scripts/product-photography/catalog-report.mjs
# With the local gallery server running at 127.0.0.1:3121:
node scripts/product-photography/check-gallery.mjs
```

The final validator checks every output's actual checksum, decodability and expected dimensions, source-original hashes, full opacity of protected source lettering regions, no text synthesis/retyping, and unchanged website mappings. The browser check tests all gallery image loading, 1440/768/390 layouts, filename search and review filtering. Native masking and source clipping still need individual inspection; a pipeline check is not an engineering certificate.
