/**
 * Recomprime imágenes ya subidas en Supabase Storage (mismo path, upsert).
 * Las URLs públicas y los publicId en Firestore NO cambian.
 *
 * Requisitos (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET (opcional, default: images)
 *
 * Uso:
 *   node scripts/recompress-supabase-images.mjs --dry-run
 *   node scripts/recompress-supabase-images.mjs
 *   node scripts/recompress-supabase-images.mjs --folder=categories
 *   node scripts/recompress-supabase-images.mjs --min-kb=200
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvFiles() {
  for (const name of [".env.local", ".env"]) {
    const filePath = path.join(root, name);
    if (!fs.existsSync(filePath)) continue;
    for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

loadEnvFiles();

const dryRun = process.argv.includes("--dry-run");
const onlyFolder = (() => {
  const arg = process.argv.find((a) => a.startsWith("--folder="));
  return arg ? arg.split("=")[1].trim().toLowerCase() : null;
})();
const minKb = (() => {
  const arg = process.argv.find((a) => a.startsWith("--min-kb="));
  return arg ? Number(arg.split("=")[1]) : 150;
})();
const minSavingsRatio = (() => {
  const arg = process.argv.find((a) => a.startsWith("--min-savings="));
  return arg ? Number(arg.split("=")[1]) : 0.15;
})();

const BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim() || "images";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const IMAGE_FOLDERS = ["categories", "products", "team", "blog", "content"];
const VIDEO_EXT = new Set(["mp4", "mov", "webm", "m4v", "avi"]);
const IMAGE_EXT = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
  "gif",
  "avif",
]);

const PROFILES = {
  categories: { maxWidth: 1920, maxHeight: 1080, quality: 82 },
  content: { maxWidth: 1920, maxHeight: 1080, quality: 82 },
  products: { maxWidth: 1400, maxHeight: 1800, quality: 84 },
  team: { maxWidth: 800, maxHeight: 800, quality: 85 },
  blog: { maxWidth: 1200, maxHeight: 800, quality: 82 },
};

function assertEnv() {
  const missing = [];
  if (!SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!SERVICE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length) {
    console.error("Faltan variables:", missing.join(", "));
    process.exit(1);
  }
}

function folderFromPath(storagePath) {
  const top = storagePath.split("/")[0];
  return IMAGE_FOLDERS.includes(top) ? top : null;
}

function isVideoPath(storagePath) {
  if (storagePath.includes("/videos/")) return true;
  const ext = storagePath.split(".").pop()?.toLowerCase();
  return ext && VIDEO_EXT.has(ext);
}

function isImagePath(storagePath) {
  const ext = storagePath.split(".").pop()?.toLowerCase();
  return ext && IMAGE_EXT.has(ext);
}

function isAnimatedGif(buffer) {
  if (buffer.length < 6) return false;
  const header = buffer.subarray(0, 6).toString("ascii");
  if (header !== "GIF87a" && header !== "GIF89a") return false;
  return buffer.includes(Buffer.from("NETSCAPE2.0"));
}

async function compressBuffer(buffer, folder) {
  const profile = PROFILES[folder] || PROFILES.content;

  if (isAnimatedGif(buffer)) {
    return { buffer, contentType: "image/gif", passthrough: true };
  }

  const pipeline = sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({
      width: profile.maxWidth,
      height: profile.maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    });

  try {
    const webpBuffer = await pipeline
      .webp({ quality: profile.quality, effort: 4 })
      .toBuffer();
    return {
      buffer: webpBuffer,
      contentType: "image/webp",
      passthrough: false,
    };
  } catch {
    const jpegBuffer = await sharp(buffer, { failOn: "none" })
      .rotate()
      .resize({
        width: profile.maxWidth,
        height: profile.maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: profile.quality, mozjpeg: true })
      .toBuffer();
    return {
      buffer: jpegBuffer,
      contentType: "image/jpeg",
      passthrough: false,
    };
  }
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function encodeStoragePath(storagePath) {
  return storagePath
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

function storageHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${SERVICE_KEY}`,
    apikey: SERVICE_KEY,
    ...extra,
  };
}

async function storageFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`);
  }
  return res;
}

async function listFolder(prefix) {
  const res = await storageFetch(
    `${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`,
    {
      method: "POST",
      headers: storageHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        prefix: prefix || "",
        limit: 1000,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      }),
    }
  );
  return res.json();
}

async function listAllObjects(prefix) {
  const files = [];
  const queue = [prefix];

  while (queue.length > 0) {
    const current = queue.shift();
    const data = await listFolder(current);

    if (!Array.isArray(data) || data.length === 0) continue;

    for (const item of data) {
      const itemPath = current ? `${current}/${item.name}` : item.name;
      if (!item.id) {
        queue.push(itemPath);
        continue;
      }
      const size =
        typeof item.metadata?.size === "number"
          ? item.metadata.size
          : Number(item.metadata?.size) || 0;
      files.push({ path: itemPath, size });
    }
  }

  return files;
}

async function downloadObject(storagePath) {
  const res = await storageFetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeStoragePath(storagePath)}`,
    { headers: storageHeaders() }
  );
  return Buffer.from(await res.arrayBuffer());
}

async function uploadObject(storagePath, buffer, contentType) {
  await storageFetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeStoragePath(storagePath)}`,
    {
      method: "POST",
      headers: storageHeaders({
        "Content-Type": contentType,
        "x-upsert": "true",
      }),
      body: buffer,
    }
  );
}

async function main() {
  assertEnv();

  if (SUPABASE_URL.includes("/rest/v1")) {
    console.error(
      "NEXT_PUBLIC_SUPABASE_URL debe ser la URL base del proyecto, sin /rest/v1.\n" +
        "Ejemplo: https://xxxx.supabase.co"
    );
    process.exit(1);
  }

  const prefixes = onlyFolder ? [onlyFolder] : IMAGE_FOLDERS;
  const minBytes = minKb * 1024;

  console.log(
    dryRun ? "=== DRY RUN (no escribe en Supabase) ===" : "=== RECOMPRIMIENDO IMÁGENES ==="
  );
  console.log(`Bucket: ${BUCKET}`);
  console.log(`Carpetas: ${prefixes.join(", ")}`);
  console.log(`Solo archivos > ${minKb} KB`);
  console.log(`Ahorro mínimo: ${(minSavingsRatio * 100).toFixed(0)}%\n`);

  const stats = {
    listed: 0,
    skippedSmall: 0,
    skippedVideo: 0,
    skippedType: 0,
    skippedNoGain: 0,
    skippedGif: 0,
    processed: 0,
    savedBytes: 0,
    errors: 0,
  };

  for (const prefix of prefixes) {
    console.log(`\n--- ${prefix}/ ---`);
    let objects;
    try {
      objects = await listAllObjects(prefix);
    } catch (err) {
      console.error(`  Error listando ${prefix}:`, err.message);
      stats.errors++;
      continue;
    }

    for (const { path: storagePath, size: listedSize } of objects) {
      stats.listed++;

      if (isVideoPath(storagePath)) {
        stats.skippedVideo++;
        continue;
      }
      if (!isImagePath(storagePath)) {
        stats.skippedType++;
        continue;
      }
      if (listedSize > 0 && listedSize < minBytes) {
        stats.skippedSmall++;
        continue;
      }

      const folder = folderFromPath(storagePath);
      if (!folder) continue;

      try {
        const original = await downloadObject(storagePath);
        const originalSize = original.length;

        if (originalSize < minBytes) {
          stats.skippedSmall++;
          continue;
        }

        const compressed = await compressBuffer(original, folder);

        if (compressed.passthrough) {
          stats.skippedGif++;
          console.log(`  ⊘ GIF animado (sin cambios): ${storagePath}`);
          continue;
        }

        const newSize = compressed.buffer.length;
        const savings = 1 - newSize / originalSize;

        if (savings < minSavingsRatio) {
          stats.skippedNoGain++;
          console.log(
            `  ⊘ Sin ahorro suficiente: ${storagePath} (${formatKb(originalSize)} → ${formatKb(newSize)})`
          );
          continue;
        }

        if (dryRun) {
          stats.processed++;
          stats.savedBytes += originalSize - newSize;
          console.log(
            `  [dry-run] ${storagePath}: ${formatKb(originalSize)} → ${formatKb(newSize)} (${compressed.contentType})`
          );
          continue;
        }

        await uploadObject(storagePath, compressed.buffer, compressed.contentType);
        stats.processed++;
        stats.savedBytes += originalSize - newSize;
        console.log(
          `  ✓ ${storagePath}: ${formatKb(originalSize)} → ${formatKb(newSize)} (${compressed.contentType})`
        );
      } catch (err) {
        stats.errors++;
        console.error(`  ✗ ${storagePath}:`, err.message);
      }
    }
  }

  console.log("\n=== RESUMEN ===");
  console.log(`Archivos listados:     ${stats.listed}`);
  console.log(`Recomprimidos:         ${stats.processed}`);
  console.log(`Omitidos (< ${minKb} KB): ${stats.skippedSmall}`);
  console.log(`Omitidos (vídeo):      ${stats.skippedVideo}`);
  console.log(`Omitidos (sin ahorro): ${stats.skippedNoGain}`);
  console.log(`Omitidos (GIF anim.):  ${stats.skippedGif}`);
  console.log(`Errores:               ${stats.errors}`);
  console.log(
    `Espacio ahorrado:      ${formatKb(stats.savedBytes)}${dryRun ? " (estimado)" : ""}`
  );
  if (dryRun) {
    console.log("\nEjecuta sin --dry-run para aplicar los cambios en Supabase.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
