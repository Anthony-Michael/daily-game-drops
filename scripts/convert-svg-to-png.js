const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Paths
const publicDir = path.join(__dirname, '..', 'public');
const sources = [
  { svg: 'icon-192.svg', png: 'icon-192.png', width: 192, height: 192 },
  { svg: 'icon-512.svg', png: 'icon-512.png', width: 512, height: 512 },
  { svg: 'og-image.svg', png: 'og-image.png', width: 1200, height: 630 }
];

async function convertSvgToPng() {
  console.log('Converting SVG files to PNG...');

  for (const source of sources) {
    const svgPath = path.join(publicDir, source.svg);
    const pngPath = path.join(publicDir, source.png);

    try {
      // Check if SVG file exists
      if (!fs.existsSync(svgPath)) {
        console.error(`SVG file not found: ${svgPath}`);
        continue;
      }

      // Read SVG file
      const svgBuffer = fs.readFileSync(svgPath);

      // Convert SVG to PNG
      await sharp(svgBuffer)
        .resize(source.width, source.height)
        .png()
        .toFile(pngPath);

      console.log(`Converted ${source.svg} to ${source.png}`);
    } catch (error) {
      console.error(`Error converting ${source.svg}:`, error);
    }
  }

  console.log('Conversion complete!');
}

convertSvgToPng().catch(console.error); 