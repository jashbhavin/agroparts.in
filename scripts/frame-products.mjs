import sharp from 'sharp';
// Square frames from genuine photographs; these crops retain the pictured components.
// Originals are kept outside public/ so another crop can be made without quality loss.
// Owner-provided replacement: retain the entire composition in the shared square canvas.
await sharp('assets/product-originals/crankcase-packaging.png')
 .resize(1200, 1200, {fit:'contain', background:'#f5f6f7'})
 .webp({quality:90})
 .toFile('public/images/products/crankcase-packaging-square.webp');
const frames = [
 ['gear-assembly', { left: 175, top: 0, width: 1050, height: 1050 }],
 ['drive-chain', { left: 0, top: 240, width: 1050, height: 1050 }],
 ['gasket-set', { left: 0, top: 190, width: 1050, height: 1050 }],
 ['clutch-components', { left: 0, top: 105, width: 1050, height: 1050 }],
 ['recoil-starters', { left: 65, top: 0, width: 1050, height: 1050 }],
];
for (const [name, crop] of frames) {
 await sharp(`assets/product-originals/${name}.webp`).extract(crop).resize(1200, 1200).webp({quality:88}).toFile(`public/images/products/${name}-square.webp`);
}
console.log('Six consistent 1200 × 1200 product photographs ready.');
