// Usage: node scripts/optimize-cards.mjs "<folder with your original template folders>"
// Reads originals (never changes them) and writes small WebP files to public/cards/<template-id>/.
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const SRC = process.argv[2];
if (!SRC) {
  console.error('Usage: node scripts/optimize-cards.mjs "<source folder>"');
  process.exit(1);
}
const OUT = path.resolve("public", "cards");

const BG_MAX = { width: 1600, height: 2000 };
const LAYER_MAX = 1600;

const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[ _]+/g, "-")
    .replace(/[^a-z0-9.-]/g, "");

const mb = (n) => (n / 1024 / 1024).toFixed(1);

let totalBefore = 0;
let totalAfter = 0;

const folders = (await fs.readdir(SRC, { withFileTypes: true })).filter((d) => d.isDirectory());
if (folders.length === 0) {
  console.error("No template folders found in", SRC);
  process.exit(1);
}

for (const folder of folders) {
  const id = norm(folder.name);
  const outDir = path.join(OUT, id);
  await fs.mkdir(outDir, { recursive: true });

  let before = 0;
  let after = 0;
  let hasBg = false;

  for (const file of await fs.readdir(path.join(SRC, folder.name))) {
    const inFile = path.join(SRC, folder.name, file);
    const stat = await fs.stat(inFile);
    if (!stat.isFile()) continue;

    const { name, ext } = path.parse(file);
    const base = norm(name);
    const lower = ext.toLowerCase();

    if (lower === ".svg") {
      await fs.copyFile(inFile, path.join(outDir, `${base}.svg`));
      before += stat.size;
      after += stat.size;
      continue;
    }
    if (![".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(lower)) continue;

    const isBg = base.startsWith("bg");
    if (isBg) hasBg = true;
    const outFile = path.join(outDir, `${base}.webp`);

    await sharp(inFile)
      .rotate()
      .resize(
        isBg
          ? { ...BG_MAX, fit: "inside", withoutEnlargement: true }
          : { width: LAYER_MAX, height: LAYER_MAX, fit: "inside", withoutEnlargement: true },
      )
      .webp({ quality: 86, alphaQuality: 90, effort: 5 })
      .toFile(outFile);

    before += stat.size;
    after += (await fs.stat(outFile)).size;
  }

  totalBefore += before;
  totalAfter += after;
  console.log(`${id.padEnd(18)} ${mb(before).padStart(7)} MB -> ${mb(after).padStart(5)} MB${hasBg ? "" : "   (no bg file!)"}`);
}

console.log(`\nTOTAL ${mb(totalBefore)} MB -> ${mb(totalAfter)} MB`);

