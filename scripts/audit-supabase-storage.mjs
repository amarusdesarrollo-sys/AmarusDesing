/**
 * Muestra uso del bucket Supabase: total, por carpeta y archivos más pesados.
 * Supabase no muestra un "total del bucket" claro en el dashboard; este script sí.
 *
 * Uso:
 *   npm run audit:storage
 *   npm run audit:storage -- --top=50
 */

import {
  assertSupabaseEnv,
  BUCKET,
  formatBytes,
  isImagePath,
  isVideoPath,
  listAllObjects,
  STORAGE_FOLDERS,
  topLevelFolder,
} from "./lib/supabase-storage-rest.mjs";

const topN = (() => {
  const arg = process.argv.find((a) => a.startsWith("--top="));
  return arg ? Number(arg.split("=")[1]) : 30;
})();

async function main() {
  assertSupabaseEnv();

  console.log(`=== AUDITORÍA STORAGE: ${BUCKET} ===\n`);
  console.log("Listando archivos (puede tardar un minuto)...\n");

  const all = [];
  for (const folder of STORAGE_FOLDERS) {
    const items = await listAllObjects(folder);
    all.push(...items);
  }

  let totalBytes = 0;
  let imageBytes = 0;
  let videoBytes = 0;
  let otherBytes = 0;
  const byFolder = {};
  const needsDownloadSize = [];

  for (const file of all) {
    let size = file.size;
    if (size <= 0) {
      needsDownloadSize.push(file.path);
      continue;
    }

    totalBytes += size;
    const folder = topLevelFolder(file.path);
    byFolder[folder] = (byFolder[folder] || 0) + size;

    if (isVideoPath(file.path)) videoBytes += size;
    else if (isImagePath(file.path)) imageBytes += size;
    else otherBytes += size;
  }

  console.log("--- RESUMEN ---");
  console.log(`Archivos:        ${all.length}`);
  console.log(`Tamaño total:    ${formatBytes(totalBytes)} (${(totalBytes / (1024 ** 3)).toFixed(2)} GB)`);
  console.log(`  Imágenes:      ${formatBytes(imageBytes)}`);
  console.log(`  Vídeos:        ${formatBytes(videoBytes)}`);
  console.log(`  Otros:         ${formatBytes(otherBytes)}`);
  if (needsDownloadSize.length) {
    console.log(`  Sin tamaño en metadata: ${needsDownloadSize.length} (no sumados arriba)`);
  }

  console.log("\n--- POR CARPETA ---");
  Object.entries(byFolder)
    .sort((a, b) => b[1] - a[1])
    .forEach(([folder, bytes]) => {
      const pct = totalBytes ? ((bytes / totalBytes) * 100).toFixed(1) : "0";
      console.log(`  ${folder.padEnd(12)} ${formatBytes(bytes).padStart(10)}  (${pct}%)`);
    });

  const videos = all
    .filter((f) => isVideoPath(f.path) && f.size > 0)
    .sort((a, b) => b.size - a.size);
  const images = all
    .filter((f) => isImagePath(f.path) && f.size > 0)
    .sort((a, b) => b.size - a.size);

  if (videos.length) {
    console.log(`\n--- TOP VÍDEOS (de ${videos.length}) ---`);
    videos.slice(0, topN).forEach((f, i) => {
      console.log(`  ${String(i + 1).padStart(2)}. ${formatBytes(f.size).padStart(10)}  ${f.path}`);
    });
    console.log(`  Total vídeos: ${formatBytes(videoBytes)}`);
  }

  console.log(`\n--- TOP ARCHIVOS (todos, top ${topN}) ---`);
  all
    .filter((f) => f.size > 0)
    .sort((a, b) => b.size - a.size)
    .slice(0, topN)
    .forEach((f, i) => {
      const kind = isVideoPath(f.path) ? "video" : isImagePath(f.path) ? "img" : "?";
      console.log(
        `  ${String(i + 1).padStart(2)}. ${formatBytes(f.size).padStart(10)}  [${kind}]  ${f.path}`
      );
    });

  const over5gb = totalBytes > 5 * 1024 ** 3;
  console.log("\n--- CUOTA FREE (5 GB) ---");
  if (over5gb) {
    const over = totalBytes - 5 * 1024 ** 3;
    console.log(`  ⚠ Por encima del límite en ~${formatBytes(over)}`);
    console.log("  Borrar duplicados/vídeos pesados o recomprimir vídeos ayuda a bajar esto.");
  } else {
    console.log(`  ✓ Dentro del límite (margen: ${formatBytes(5 * 1024 ** 3 - totalBytes)})`);
  }

  console.log(
    "\nNota: el panel Usage de Supabase puede tardar horas en actualizarse tras borrar/comprimir."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
