import sharp from 'sharp';
import { readdir } from 'node:fs/promises';
const widths = [64, 128, 256, 480, 768, 1200, 1600];
for (const folder of ['products', 'facilities']) {
 const dir = `public/images/${folder}`;
 for (const file of await readdir(dir)) {
  if (!file.endsWith('.webp') || /-\d+\.webp$/.test(file)) continue;
  for (const width of widths) {
   await sharp(`${dir}/${file}`).resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(`${dir}/${file.replace('.webp', `-${width}.webp`)}`);
  }
 }
}
console.log('Responsive WebP variants ready.');
