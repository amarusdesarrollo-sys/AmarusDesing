import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function loadEnvFiles() {
  const root = path.join(__dirname, "..", "..");
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

export const BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim() || "images";
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(
  /\/$/,
  ""
);
export const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

export const STORAGE_FOLDERS = [
  "categories",
  "products",
  "team",
  "blog",
  "content",
];

export const VIDEO_EXT = new Set([
  "mp4",
  "mov",
  "webm",
  "m4v",
  "avi",
  "hevc",
  "mkv",
  "3gp",
]);

export const IMAGE_EXT = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
  "gif",
  "avif",
]);

export function assertSupabaseEnv() {
  const missing = [];
  if (!SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!SERVICE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length) {
    console.error("Faltan variables:", missing.join(", "));
    process.exit(1);
  }
  if (SUPABASE_URL.includes("/rest/v1")) {
    console.error(
      "NEXT_PUBLIC_SUPABASE_URL debe ser la URL base (sin /rest/v1).\n" +
        "Ejemplo: https://xxxx.supabase.co"
    );
    process.exit(1);
  }
}

export function formatBytes(bytes) {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function formatKb(bytes) {
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

export async function listAllObjects(prefix) {
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
      const metaSize = item.metadata?.size;
      const size =
        typeof metaSize === "number"
          ? metaSize
          : Number(metaSize) || 0;
      files.push({ path: itemPath, size });
    }
  }

  return files;
}

export async function downloadObject(storagePath) {
  const res = await storageFetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeStoragePath(storagePath)}`,
    { headers: storageHeaders() }
  );
  return Buffer.from(await res.arrayBuffer());
}

export async function uploadObject(storagePath, buffer, contentType) {
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

export function isVideoPath(storagePath) {
  if (storagePath.includes("/videos/")) return true;
  const ext = storagePath.split(".").pop()?.toLowerCase();
  return ext && VIDEO_EXT.has(ext);
}

export function isImagePath(storagePath) {
  const ext = storagePath.split(".").pop()?.toLowerCase();
  return ext && IMAGE_EXT.has(ext);
}

export function topLevelFolder(storagePath) {
  return storagePath.split("/")[0] || "other";
}
