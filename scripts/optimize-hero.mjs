import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import { join } from "node:path";

const directory = join(process.cwd(), "public", "images");
const input = join(directory, "hero-architecture.png");
const formats = [
  { width: 960, file: "hero-architecture-mobile.webp", quality: 79 },
  { width: 1920, file: "hero-architecture-desktop.webp", quality: 82 },
];

await mkdir(directory, { recursive: true });
await Promise.all(formats.map(async ({ width, file, quality }) => {
  const target = join(directory, file);
  await sharp(input).rotate().resize({ width, withoutEnlargement: true }).webp({ quality, effort: 5 }).toFile(target);
  const { size } = await stat(target);
  console.log("Optimized hero:", file, Math.round(size / 1024) + " KiB");
}));
