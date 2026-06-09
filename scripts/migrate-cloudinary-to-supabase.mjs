/**
 * Migra medios de Cloudinary → Supabase Storage actualizando Firestore.
 *
 * Requisitos (.env.local):
 *   FIREBASE_SERVICE_ACCOUNT_KEY o FIREBASE_SERVICE_ACCOUNT_KEY_BASE64
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME (si solo hay publicId sin URL)
 *
 * Uso:
 *   node scripts/migrate-cloudinary-to-supabase.mjs --dry-run
 *   node scripts/migrate-cloudinary-to-supabase.mjs
 *   node scripts/migrate-cloudinary-to-supabase.mjs --collection=products
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
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
const onlyCollection = (() => {
  const arg = process.argv.find((a) => a.startsWith("--collection="));
  return arg ? arg.split("=")[1] : null;
})();

const BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim() || "images";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();

function assertEnv() {
  const missing = [];
  if (!getFirebaseCredentials()) missing.push("FIREBASE_SERVICE_ACCOUNT_KEY(_BASE64)");
  if (!SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!SERVICE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length) {
    console.error("Faltan variables:", missing.join(", "));
    process.exit(1);
  }
}

function getFirebaseCredentials() {
  const plain = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (plain) return JSON.parse(plain);
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64?.trim();
  if (!b64) return null;
  return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
}

function isCloudinaryUrl(url) {
  return typeof url === "string" && url.includes("cloudinary.com");
}

function isSupabaseUrl(url) {
  return (
    typeof url === "string" &&
    url.includes(".supabase.co/storage/v1/object/public/")
  );
}

function buildStoragePublicUrl(storagePath) {
  const encoded = storagePath
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encoded}`;
}

function cloudinaryDownloadUrl(publicId, isVideo) {
  if (!publicId || !CLOUD_NAME) return null;
  const clean = publicId.replace(/^\/+/, "");
  const resource = isVideo ? "video" : "image";
  const encoded = encodeURIComponent(clean).replace(/%2F/g, "/");
  return `https://res.cloudinary.com/${CLOUD_NAME}/${resource}/upload/${encoded}`;
}

function extFromUrl(url, fallback = "jpg") {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([a-z0-9]{2,5})$/i);
    return match ? match[1].toLowerCase() : fallback;
  } catch {
    return fallback;
  }
}

function sanitizeStem(value) {
  return String(value || "asset")
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .toLowerCase()
    .slice(0, 48);
}

function buildTargetPath(folder, sourceUrl, isVideo) {
  const stem = sanitizeStem(path.basename(new URL(sourceUrl).pathname));
  const ext = extFromUrl(sourceUrl, isVideo ? "mp4" : "jpg");
  const ts = Date.now();
  if (isVideo && folder === "products") {
    return `products/videos/migrated-${ts}-${stem}.${ext}`;
  }
  return `${folder}/migrated-${ts}-${stem}.${ext}`;
}

const migratedUrlCache = new Map();

async function migrateUrl(sourceUrl, folder, isVideo) {
  const key = sourceUrl;
  if (migratedUrlCache.has(key)) return migratedUrlCache.get(key);

  if (isSupabaseUrl(sourceUrl)) {
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const idx = sourceUrl.indexOf(marker);
    const storagePath = decodeURIComponent(
      sourceUrl.slice(idx + marker.length).split("?")[0]
    );
    const result = { storagePath, url: sourceUrl, skipped: true };
    migratedUrlCache.set(key, result);
    return result;
  }

  if (!isCloudinaryUrl(sourceUrl)) {
    return { skipped: true, reason: "not-cloudinary" };
  }

  const storagePath = buildTargetPath(folder, sourceUrl, isVideo);
  const publicUrl = buildStoragePublicUrl(storagePath);

  if (dryRun) {
    console.log(`  [dry-run] ${sourceUrl}\n           → ${publicUrl}`);
    const result = { storagePath, url: publicUrl, dryRun: true };
    migratedUrlCache.set(key, result);
    return result;
  }

  const res = await fetch(sourceUrl);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} al descargar ${sourceUrl}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType =
    res.headers.get("content-type") ||
    (isVideo ? "video/mp4" : "image/jpeg");

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: false });

  if (error) {
    throw new Error(`${error.message} (${storagePath})`);
  }

  console.log(`  ✓ ${storagePath}`);
  const result = { storagePath, url: publicUrl };
  migratedUrlCache.set(key, result);
  return result;
}

async function resolveAndMigrate({ url, publicId, folder, isVideo }) {
  let source = typeof url === "string" && url.trim() ? url.trim() : null;
  if (source && isSupabaseUrl(source)) {
    return { storagePath: publicId || null, url: source, skipped: true };
  }
  if (!source || !isCloudinaryUrl(source)) {
    if (publicId && !isSupabaseUrl(publicId) && !publicId.startsWith("http")) {
      source = cloudinaryDownloadUrl(publicId, isVideo);
    }
  }
  if (!source) return { skipped: true, reason: "no-source" };
  if (!isCloudinaryUrl(source)) return { skipped: true, reason: "not-cloudinary" };

  const { storagePath, url: newUrl, skipped, dryRun: isDry } =
    await migrateUrl(source, folder, isVideo);
  if (skipped && !dryRun) return { storagePath, url: newUrl, skipped: true };
  return { storagePath, url: newUrl, dryRun: isDry };
}

async function main() {
  assertEnv();

  const { cert, initializeApp, getApps } = require("firebase-admin/app");
  const { getFirestore } = require("firebase-admin/firestore");

  if (!getApps().length) {
    initializeApp({ credential: cert(getFirebaseCredentials()) });
  }
  const db = getFirestore();

  const stats = { docs: 0, assets: 0, migrated: 0, skipped: 0, errors: 0 };

  async function updateDoc(ref, patch) {
    if (dryRun) {
      console.log(`  [dry-run] update ${ref.path}`, JSON.stringify(patch));
      return;
    }
    await ref.update(patch);
  }

  if (!onlyCollection || onlyCollection === "products") {
    console.log("\n=== products ===");
    const snap = await db.collection("products").get();
    for (const doc of snap.docs) {
      stats.docs++;
      const data = doc.data();
      const images = Array.isArray(data.images) ? [...data.images] : [];
      let changed = false;
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const isVideo = img?.mediaType === "video";
        try {
          const result = await resolveAndMigrate({
            url: img?.url,
            publicId: img?.publicId,
            folder: "products",
            isVideo,
          });
          stats.assets++;
          if (result.skipped) {
            stats.skipped++;
            continue;
          }
          if (result.storagePath && result.url) {
            images[i] = {
              ...img,
              publicId: result.storagePath,
              url: result.url,
            };
            changed = true;
            stats.migrated++;
          }
        } catch (e) {
          stats.errors++;
          console.error(`  ✗ product ${doc.id} image ${i}:`, e.message);
        }
      }
      if (changed) await updateDoc(doc.ref, { images });
    }
  }

  if (!onlyCollection || onlyCollection === "categories") {
    console.log("\n=== categories ===");
    const snap = await db.collection("categories").get();
    for (const doc of snap.docs) {
      stats.docs++;
      const data = doc.data();
      try {
        const result = await resolveAndMigrate({
          url: data.imageUrl,
          publicId: data.image,
          folder: "categories",
          isVideo: false,
        });
        stats.assets++;
        if (!result.skipped && result.storagePath && result.url) {
          await updateDoc(doc.ref, {
            image: result.storagePath,
            imageUrl: result.url,
          });
          stats.migrated++;
        } else stats.skipped++;
      } catch (e) {
        stats.errors++;
        console.error(`  ✗ category ${doc.id}:`, e.message);
      }
    }
  }

  if (!onlyCollection || onlyCollection === "blogPosts") {
    console.log("\n=== blogPosts ===");
    const snap = await db.collection("blogPosts").get();
    for (const doc of snap.docs) {
      stats.docs++;
      const data = doc.data();
      try {
        const result = await resolveAndMigrate({
          url: data.imageUrl,
          publicId: data.imagePublicId,
          folder: "blog",
          isVideo: false,
        });
        stats.assets++;
        if (!result.skipped && result.storagePath && result.url) {
          await updateDoc(doc.ref, {
            imagePublicId: result.storagePath,
            imageUrl: result.url,
          });
          stats.migrated++;
        } else stats.skipped++;
      } catch (e) {
        stats.errors++;
        console.error(`  ✗ blog ${doc.id}:`, e.message);
      }
    }
  }

  if (!onlyCollection || onlyCollection === "teamMembers") {
    console.log("\n=== teamMembers ===");
    const snap = await db.collection("teamMembers").get();
    for (const doc of snap.docs) {
      stats.docs++;
      const data = doc.data();
      try {
        const result = await resolveAndMigrate({
          url: data.imageUrl,
          publicId: data.imagePublicId,
          folder: "team",
          isVideo: false,
        });
        stats.assets++;
        if (!result.skipped && result.storagePath && result.url) {
          await updateDoc(doc.ref, {
            imagePublicId: result.storagePath,
            imageUrl: result.url,
          });
          stats.migrated++;
        } else stats.skipped++;
      } catch (e) {
        stats.errors++;
        console.error(`  ✗ team ${doc.id}:`, e.message);
      }
    }
  }

  if (!onlyCollection || onlyCollection === "content") {
    console.log("\n=== content ===");
    const contentDocs = [
      {
        id: "historia",
        fields: { publicId: "imagePublicId", url: "imageUrl" },
        folder: "content",
      },
      {
        id: "politicas",
        fields: { publicId: "heroImagePublicId", url: "heroImageUrl" },
        folder: "content",
      },
    ];

    for (const meta of contentDocs) {
      const ref = db.collection("content").doc(meta.id);
      const snap = await ref.get();
      if (!snap.exists) continue;
      stats.docs++;
      const data = snap.data();
      try {
        const result = await resolveAndMigrate({
          url: data[meta.fields.url],
          publicId: data[meta.fields.publicId],
          folder: meta.folder,
          isVideo: false,
        });
        stats.assets++;
        if (!result.skipped && result.storagePath && result.url) {
          await updateDoc(ref, {
            [meta.fields.publicId]: result.storagePath,
            [meta.fields.url]: result.url,
          });
          stats.migrated++;
        } else stats.skipped++;
      } catch (e) {
        stats.errors++;
        console.error(`  ✗ content/${meta.id}:`, e.message);
      }
    }

    const homeRef = db.collection("content").doc("home");
    const homeSnap = await homeRef.get();
    if (homeSnap.exists) {
      stats.docs++;
      const data = homeSnap.data();
      const historia = data.historia || {};
      try {
        const result = await resolveAndMigrate({
          url: historia.imageUrl,
          publicId: historia.imagePublicId,
          folder: "content",
          isVideo: false,
        });
        stats.assets++;
        if (!result.skipped && result.storagePath && result.url) {
          const patch = {
            historia: {
              ...historia,
              imagePublicId: result.storagePath,
              imageUrl: result.url,
            },
          };
          await updateDoc(homeRef, patch);
          stats.migrated++;
        } else stats.skipped++;
      } catch (e) {
        stats.errors++;
        console.error("  ✗ content/home:", e.message);
      }
    }
  }

  console.log("\n--- Resumen ---");
  console.log(
    JSON.stringify(
      { dryRun, ...stats },
      null,
      2
    )
  );
  if (stats.errors > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
