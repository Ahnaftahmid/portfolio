#!/usr/bin/env node
/*
 * Pulls every raster image used by the site straight from the Figma file
 * into assets/img/, using the Figma REST API.
 *
 *   FIGMA_TOKEN=figd_xxx node scripts/fetch-figma-assets.mjs
 *
 * Create a personal access token in Figma → Settings → Security →
 * Personal access tokens (scope: File content → Read only).
 * Requires Node 18+ (built-in fetch).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FILE_KEY = "YVe6te0BxiSp3xgrW3iC6T";
const TOKEN = process.env.FIGMA_TOKEN;
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "img");

// file name → Figma node, export format and scale
const ASSETS = {
  "hero.jpg":             { id: "349:43668", format: "jpg", scale: 2 },
  "logo.png":             { id: "349:43558", format: "png", scale: 2 },
  "intro-main.jpg":       { id: "341:43007", format: "jpg", scale: 2 },
  "intro-small.jpg":      { id: "341:43001", format: "jpg", scale: 2 },
  "project-airie.jpg":    { id: "341:19911", format: "jpg", scale: 1.5 },
  "project-panorama.jpg": { id: "357:43725", format: "jpg", scale: 1.5 },
  "project-valley.jpg":   { id: "357:43731", format: "jpg", scale: 1.5 },
  "sketch-guides.png":    { id: "357:91736", format: "png", scale: 2 },
  "sketch-tone.png":      { id: "357:91744", format: "png", scale: 2 },
  "sketch-structure.png": { id: "357:91746", format: "png", scale: 2 },
  "sketch-detail.png":    { id: "357:91754", format: "png", scale: 2 },
  "sketch-planting.png":  { id: "357:91762", format: "png", scale: 2 },
  "sketch-shade.png":     { id: "357:91770", format: "png", scale: 2 },
  "cloudtree.jpg":        { id: "357:91815", format: "jpg", scale: 1.5 },
  "expertise-1.jpg":      { id: "I418:93029;386:557", format: "jpg", scale: 2 },
  "expertise-2.jpg":      { id: "I418:93029;386:568", format: "jpg", scale: 2 },
  "expertise-3.jpg":      { id: "I418:93029;386:579", format: "jpg", scale: 2 },
  "expertise-4.jpg":      { id: "I418:93029;386:590", format: "jpg", scale: 2 },
  "contact-side.jpg":     { id: "379:92373", format: "jpg", scale: 1.5 },
  "contact-bg.png":       { id: "379:92376", format: "png", scale: 1.5 },
  "footer-texture.png":   { id: "357:92109", format: "png", scale: 0.5 },
};
// Hidden layer in Figma (render API skips hidden nodes) → pull its original image fill instead
const IMAGE_FILLS = { "sketch-photo.jpg": "357:91777" };

if (!TOKEN) {
  console.error("Set FIGMA_TOKEN to a Figma personal access token first.");
  process.exit(1);
}

const api = async (path) => {
  const res = await fetch(`https://api.figma.com/v1/${path}`, { headers: { "X-Figma-Token": TOKEN } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  return res.json();
};
const download = async (url, name) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} downloading ${name}`);
  await writeFile(join(OUT, name), Buffer.from(await res.arrayBuffer()));
  console.log("  ✓", name);
};

await mkdir(OUT, { recursive: true });

// Group renders by format+scale so each group is one API call
const groups = {};
for (const [name, a] of Object.entries(ASSETS)) (groups[`${a.format}@${a.scale}`] ||= []).push([name, a.id]);

for (const [key, items] of Object.entries(groups)) {
  const [format, scale] = key.split("@");
  const ids = items.map(([, id]) => id).join(",");
  console.log(`Rendering ${items.length} × ${format} @${scale}x`);
  const { images } = await api(`images/${FILE_KEY}?ids=${encodeURIComponent(ids)}&format=${format}&scale=${scale}`);
  for (const [name, id] of items) {
    if (!images[id]) { console.warn("  ✗ no render for", name, id); continue; }
    await download(images[id], name);
  }
}

console.log("Fetching original image fills");
const fills = (await api(`files/${FILE_KEY}/images`)).meta.images;
for (const [name, id] of Object.entries(IMAGE_FILLS)) {
  const node = (await api(`files/${FILE_KEY}/nodes?ids=${encodeURIComponent(id)}`)).nodes[id]?.document;
  const ref = node?.fills?.find((f) => f.type === "IMAGE")?.imageRef;
  if (ref && fills[ref]) await download(fills[ref], name);
  else console.warn("  ✗ no image fill for", name, id);
}
console.log("Done →", OUT);
