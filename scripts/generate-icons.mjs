import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

function createIconSvg(size) {
  const fontSize = Math.round(size * 0.55);
  const y = Math.round(size * 0.58);
  return Buffer.from(`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.15)}" fill="#000000"/>
  <text x="50%" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">F</text>
</svg>`);
}

const sizes = [192, 512];

for (const size of sizes) {
  const svg = createIconSvg(size);
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(join(outDir, `icon-${size}x${size}.png`));
  console.log(`Generated icon-${size}x${size}.png`);
}

// Also generate apple-touch-icon (180x180)
const appleSvg = createIconSvg(180);
await sharp(appleSvg)
  .resize(180, 180)
  .png()
  .toFile(join(outDir, 'apple-touch-icon.png'));
console.log('Generated apple-touch-icon.png');
