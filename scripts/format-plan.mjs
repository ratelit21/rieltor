import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  console.error("Usage: node scripts/format-plan.mjs <input-image> <output.webp>");
  process.exitCode = 1;
} else {
  const canvas = { width: 1456, height: 1092 };
  const inset = { x: 92, y: 92, width: 1272, height: 908 };
  const planPadding = 42;
  const sourceStats = await sharp(inputPath).stats();
  const dominant = sourceStats.dominant;
  const burgundyCanvas =
    dominant.r > dominant.g * 1.6 &&
    dominant.r > dominant.b * 1.6 &&
    dominant.r < 150;

  const { data, info } = await sharp(inputPath)
    .rotate()
    .resize({
      width: inset.width - planPadding * 2,
      height: inset.height - planPadding * 2,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // The source drawing stays intact: this only maps its pixels into the site's
  // paper / wine palette. Light white and pale-green catalogue backgrounds
  // become transparent, so the paper canvas below shows through.
  for (let offset = 0; offset < data.length; offset += 4) {
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const sourceAlpha = data[offset + 3];
    const lightness = red * 0.2126 + green * 0.7152 + blue * 0.0722;
    const greenPaper = green - Math.max(red, blue) > 5 && lightness > 176;

    if (sourceAlpha === 0) {
      data[offset + 3] = 0;
      continue;
    }

    if (burgundyCanvas) {
      // Older rendered plans use a dark wine canvas with pale drawing strokes.
      // Drop the dark field (including its texture), then turn the pale drawing
      // into the same wine ink used for white catalogue plans.
      const darkBurgundyField =
        lightness < 108 && red > green * 1.25 && red > blue * 1.25;

      if (darkBurgundyField) {
        data[offset + 3] = 0;
        continue;
      }

      const inkOpacity = Math.min(1, Math.max(0.42, (lightness - 56) / 174));
      data[offset] = 78;
      data[offset + 1] = 13;
      data[offset + 2] = 29;
      data[offset + 3] = Math.round(sourceAlpha * inkOpacity);
      continue;
    }

    if (lightness > 235 || greenPaper) {
      data[offset + 3] = 0;
      continue;
    }

    if (lightness < 96) {
      data[offset] = 78;
      data[offset + 1] = 13;
      data[offset + 2] = 29;
      continue;
    }

    if (lightness < 172) {
      data[offset] = 123;
      data[offset + 1] = 54;
      data[offset + 2] = 67;
      data[offset + 3] = Math.round(sourceAlpha * 0.82);
      continue;
    }

    data[offset] = 151;
    data[offset + 1] = 101;
    data[offset + 2] = 106;
    data[offset + 3] = Math.round(sourceAlpha * 0.34);
  }

  const frame = Buffer.from(`
    <svg width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#eee5d8"/>
      <rect x="28" y="28" width="1400" height="1036" rx="2" fill="#f8f3eb" stroke="#6f2133" stroke-width="1"/>
      <rect x="${inset.x}" y="${inset.y}" width="${inset.width}" height="${inset.height}" fill="#f1e8db" stroke="#a37078" stroke-width="1"/>
      <path d="M${inset.x} ${inset.y + 22}h30M${inset.x + 22} ${inset.y}v30M${inset.x + inset.width - 30} ${inset.y + 22}h30M${inset.x + inset.width - 22} ${inset.y}v30M${inset.x} ${inset.y + inset.height - 22}h30M${inset.x + 22} ${inset.y + inset.height - 30}v30M${inset.x + inset.width - 30} ${inset.y + inset.height - 22}h30M${inset.x + inset.width - 22} ${inset.y + inset.height - 30}v30" fill="none" stroke="#6f2133" stroke-width="1"/>
    </svg>
  `);

  const styledPlan = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();

  await mkdir(path.dirname(outputPath), { recursive: true });
  await sharp({
    create: {
      width: canvas.width,
      height: canvas.height,
      channels: 4,
      background: { r: 238, g: 229, b: 216, alpha: 1 },
    },
  })
    .composite([
      { input: frame, top: 0, left: 0 },
      { input: styledPlan, top: inset.y + planPadding, left: inset.x + planPadding },
    ])
    .webp({ quality: 92, effort: 5 })
    .toFile(outputPath);

  console.log(`Formatted plan: ${outputPath}`);
}
