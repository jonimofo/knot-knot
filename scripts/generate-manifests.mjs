#!/usr/bin/env node
import { readdir, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const IMAGES_DIR = "images";
const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"]);

function extOf(name) {
  const i = name.lastIndexOf(".");
  return i < 0 ? "" : name.slice(i).toLowerCase();
}

async function main() {
  if (!existsSync(IMAGES_DIR)) {
    console.log(`No ${IMAGES_DIR}/ directory — nothing to do.`);
    return;
  }
  const entries = await readdir(IMAGES_DIR, { withFileTypes: true });
  const folders = entries.filter((e) => e.isDirectory());

  for (const dir of folders) {
    const folderPath = join(IMAGES_DIR, dir.name);
    const files = (await readdir(folderPath))
      .filter((f) => IMAGE_EXT.has(extOf(f)))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
    const manifestPath = join(folderPath, "manifest.json");
    await writeFile(manifestPath, JSON.stringify(files, null, 2) + "\n");
    console.log(`wrote ${manifestPath} (${files.length} files)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
