/* Rebuild the cover from the original, not from an already compressed WebP. */
const sharp = require('sharp');
const path = require('node:path');

async function main() {
  const root = path.resolve(__dirname, '..');
  const source = path.join(root, 'ref', 'photo (12).JPG');
  const output = path.join(root, 'public', 'images');
  const original = sharp(source).rotate();
  const { width, height } = await original.metadata();
  const portraitWidth = Math.round(height * .75);
  const results = await Promise.all([
    original.clone().resize({ width: 3840, withoutEnlargement: true })
      .webp({ quality: 94, effort: 6 }).toFile(path.join(output, 'cover-landscape-hd.webp')),
    original.clone().extract({ left: Math.round((width - portraitWidth) / 2), top: 0, width: portraitWidth, height })
      .resize({ width: 2048, withoutEnlargement: true })
      .webp({ quality: 94, effort: 6 }).toFile(path.join(output, 'cover-portrait-hd.webp')),
  ]);
  results.forEach((result, index) => console.log(index ? 'Portrait' : 'Landscape', result.width, result.height, `${Math.round(result.size / 1024)} KB`));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
