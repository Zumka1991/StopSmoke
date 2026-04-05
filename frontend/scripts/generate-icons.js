import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths relative to frontend folder
const svgPath = path.join(__dirname, '..', 'public', 'icon.svg');
const outputDir = path.join(__dirname, '..', 'public');

async function generateIcons() {
  try {
    console.log('Generating PWA icons from SVG...');
    console.log('SVG source:', svgPath);
    console.log('Output dir:', outputDir);
    
    await sharp(svgPath)
      .resize(192, 192)
      .png()
      .toFile(path.join(outputDir, 'pwa-192x192.png'));
      
    console.log('Generated pwa-192x192.png');

    await sharp(svgPath)
      .resize(512, 512)
      .png()
      .toFile(path.join(outputDir, 'pwa-512x512.png'));
      
    console.log('Generated pwa-512x512.png');

    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
