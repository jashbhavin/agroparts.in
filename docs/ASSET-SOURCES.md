# Owner-supplied asset provenance

Source folder: `/Users/jashjain/Desktop/agro/Agro Content`.
Official logo: `/Users/jashjain/Desktop/agrologo.png`, copied unchanged.

All WebP photographs are resized, compressed copies. No generated images or invented facilities are used. Original files are untouched. Facility photographs are stills extracted using macOS Quick Look from owner-supplied videos.

| Website asset | Original file |
| --- | --- |
| facilities/warehouse.webp | IMG_5605.mov |
| facilities/premises.webp | IMG_5585.mov |
| facilities/storage.webp | IMG_5600.mov |
| facilities/packaged-parts.webp | IMG_5598.mov |
| facilities/packing.webp | IMG_5725.MOV |
| products/cylinder-assemblies.webp | IMG_5636.HEIC |
| products/gear-assembly.webp | IMG_5647.heic |
| products/drive-chain.webp | IMG_5665.heic |
| products/gasket-set.webp | IMG_5694.heic |
| products/equipment-blades.webp | IMG_5770.heic |
| products/recoil-starters.webp | IMG_5775.heic |
| products/parts-portfolio.webp | IMG_5706.heic |

File suffix capitalization may vary on the source disk. Product category names describe visible components and require owner approval. No specifications, compatibility, stock levels, or warranties are inferred from images. Owner must confirm usage rights and permission to show the premises and any identifiable people.

`npm run images` generates static responsive variants from the base WebP files. The custom Next Image loader serves these files without a runtime image service. Keep all variants together when deploying `out/`.

## Uniform product framing

Product cards use 1200 × 1200 WebP photographs with individually reviewed crops, no generated imagery and no letterboxing. Run `node scripts/frame-products.mjs` and `npm run images` to regenerate them. Source crops are retained under `assets/product-originals/`.

Sources: cylinder IMG_5634; gears IMG_5637; chains IMG_5664; gaskets IMG_5695; clutch IMG_5656; starters IMG_5773. The clutch photo replaces the wide blade arrangement for a clearer, compact product composition. Original blade photographs remain in the project.

## Owner-provided crankcase replacement

The first product card now uses `crankcase-packaging-square.webp`, derived from the owner-provided `Precision Crankcase and Agro Solutions Packaging.png`. The complete supplied composition is preserved within the 1200 × 1200 card format. The original PNG is retained at `assets/product-originals/crankcase-packaging.png`; regeneration is included in `scripts/frame-products.mjs`. This supersedes the previous first-card photograph.
