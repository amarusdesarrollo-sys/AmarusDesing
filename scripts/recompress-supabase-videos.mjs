/**
 * Recomprime vídeos en Supabase Storage (mismo path, upsert).
 * Requiere ffmpeg instalado en el sistema: https://ffmpeg.org/download.html
 *
 * Uso:
 *   npm run recompress:videos -- --dry-run
 *   npm run recompress:videos
 *   npm run recompress:videos -- --min-mb=2
 */

import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";
import {
  assertSupabaseEnv,
  BUCKET,
  downloadObject,
  formatBytes,
  formatKb,
  isVideoPath,
  listAllObjects,
  uploadObject,
} from "./lib/supabase-storage-rest.mjs";

const dryRun = process.argv.includes("--dry-run");
const minMb = (() => {
  const arg = process.argv.find((a) => a.startsWith("--min-mb="));
  return arg ? Number(arg.split("=")[1]) : 1;
})();
const minSavingsRatio = (() => {
  const arg = process.argv.find((a) => a.startsWith("--min-savings="));
  return arg ? Number(arg.split("=")[1]) : 0.2;
})();

/** Max ancho para vídeos de producto en web */
const MAX_WIDTH = 1280;
const CRF = 28;
const AUDIO_BITRATE = "128k";

let ffmpegBin = "ffmpeg";

function resolveFfmpegPath() {
  const fromArg = process.argv.find((a) => a.startsWith("--ffmpeg="));
  if (fromArg) {
    const p = fromArg.split("=").slice(1).join("=");
    if (fs.existsSync(p)) return p;
  }

  const pathProbe = spawnSync("ffmpeg", ["-version"], {
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (pathProbe.status === 0) return "ffmpeg";

  if (process.platform === "win32") {
    const localAppData =
      process.env.LOCALAPPDATA ||
      path.join(os.homedir(), "AppData", "Local");
    const wingetRoot = path.join(localAppData, "Microsoft", "WinGet", "Packages");
    if (fs.existsSync(wingetRoot)) {
      for (const pkg of fs.readdirSync(wingetRoot)) {
        if (!pkg.toLowerCase().includes("ffmpeg")) continue;
        const bin = path.join(wingetRoot, pkg, "bin", "ffmpeg.exe");
        if (fs.existsSync(bin)) return bin;
        const nested = path.join(wingetRoot, pkg);
        for (const entry of fs.readdirSync(nested, { withFileTypes: true })) {
          if (!entry.isDirectory()) continue;
          const nestedBin = path.join(nested, entry.name, "bin", "ffmpeg.exe");
          if (fs.existsSync(nestedBin)) return nestedBin;
        }
      }
    }
  }

  return null;
}

function hasFfmpeg() {
  ffmpegBin = resolveFfmpegPath();
  if (!ffmpegBin) return false;
  const r = spawnSync(ffmpegBin, ["-version"], {
    encoding: "utf8",
    shell: process.platform === "win32" && !ffmpegBin.includes(path.sep),
  });
  return r.status === 0;
}

function runFfmpeg(args) {
  return spawnSync(ffmpegBin, args, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    shell: process.platform === "win32" && !ffmpegBin.includes(path.sep),
  });
}

function transcodeVideo(inputPath, outputPath) {
  const args = [
    "-y",
    "-i",
    inputPath,
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    String(CRF),
    "-movflags",
    "+faststart",
    "-vf",
    `scale='min(${MAX_WIDTH},iw)':-2`,
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    AUDIO_BITRATE,
    outputPath,
  ];
  const r = runFfmpeg(args);
  if (r.status !== 0) {
    const noAudio = runFfmpeg([
        "-y",
        "-i",
        inputPath,
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        String(CRF),
        "-movflags",
        "+faststart",
        "-vf",
        `scale='min(${MAX_WIDTH},iw)':-2`,
        "-pix_fmt",
        "yuv420p",
        "-an",
        outputPath,
      ]);
    if (noAudio.status !== 0) {
      throw new Error(r.stderr?.slice(-400) || "ffmpeg falló");
    }
  }
}

async function main() {
  assertSupabaseEnv();

  if (!hasFfmpeg()) {
    console.error(
      "ffmpeg no está instalado o no está en el PATH.\n" +
        "Windows: winget install ffmpeg   o   https://www.gyan.dev/ffmpeg/builds/\n" +
        "Tras instalar, abrí una terminal NUEVA (Git Bash / Cursor) y volvé a ejecutar.\n" +
        "O indicá la ruta: npm run recompress:videos -- --ffmpeg=C:\\ruta\\a\\ffmpeg.exe"
    );
    process.exit(1);
  }

  if (ffmpegBin !== "ffmpeg") {
    console.log(`Usando ffmpeg: ${ffmpegBin}\n`);
  }

  const minBytes = minMb * 1024 * 1024;

  console.log(
    dryRun ? "=== DRY RUN VÍDEOS (no escribe en Supabase) ===" : "=== RECOMPRIMIENDO VÍDEOS ==="
  );
  console.log(`Bucket: ${BUCKET}`);
  console.log(`Solo vídeos > ${minMb} MB | ahorro mínimo ${(minSavingsRatio * 100).toFixed(0)}%`);
  console.log(`Perfil: H.264 max ${MAX_WIDTH}px, CRF ${CRF}\n`);

  const products = await listAllObjects("products");
  const videos = products.filter((f) => isVideoPath(f.path));

  const stats = {
    listed: videos.length,
    skippedSmall: 0,
    processed: 0,
    skippedNoGain: 0,
    savedBytes: 0,
    errors: 0,
  };

  for (const { path: storagePath, size: listedSize } of videos) {
    if (listedSize > 0 && listedSize < minBytes) {
      stats.skippedSmall++;
      continue;
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "amarus-video-"));
    const ext = path.extname(storagePath) || ".mp4";
    const inputFile = path.join(tmpDir, `in${ext}`);
    const outputFile = path.join(tmpDir, "out.mp4");

    try {
      console.log(`  … descargando ${storagePath}`);
      const original = await downloadObject(storagePath);
      const originalSize = original.length;

      if (originalSize < minBytes) {
        stats.skippedSmall++;
        continue;
      }

      fs.writeFileSync(inputFile, original);

      if (dryRun) {
        console.log(
          `  [dry-run] ${storagePath}: ${formatBytes(originalSize)} → (se transcodificaría a H.264 ~1280px)`
        );
        stats.processed++;
        continue;
      }

      console.log(`  … transcodificando ${storagePath} (${formatBytes(originalSize)})`);
      transcodeVideo(inputFile, outputFile);
      const compressed = fs.readFileSync(outputFile);
      const newSize = compressed.length;
      const savings = 1 - newSize / originalSize;

      if (savings < minSavingsRatio) {
        stats.skippedNoGain++;
        console.log(
          `  ⊘ Sin ahorro suficiente: ${storagePath} (${formatKb(originalSize)} → ${formatKb(newSize)})`
        );
        continue;
      }

      await uploadObject(storagePath, compressed, "video/mp4");
      stats.processed++;
      stats.savedBytes += originalSize - newSize;
      console.log(
        `  ✓ ${storagePath}: ${formatBytes(originalSize)} → ${formatBytes(newSize)} (video/mp4)`
      );
    } catch (err) {
      stats.errors++;
      console.error(`  ✗ ${storagePath}:`, err.message || err);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }

  console.log("\n=== RESUMEN VÍDEOS ===");
  console.log(`Vídeos listados:       ${stats.listed}`);
  console.log(`Procesados:            ${stats.processed}`);
  console.log(`Omitidos (< ${minMb} MB): ${stats.skippedSmall}`);
  console.log(`Omitidos (sin ahorro): ${stats.skippedNoGain}`);
  console.log(`Errores:               ${stats.errors}`);
  console.log(
    `Espacio ahorrado:      ${formatBytes(stats.savedBytes)}${dryRun ? " (dry-run: no aplicado)" : ""}`
  );

  if (dryRun) {
    console.log("\nEjecuta sin --dry-run para aplicar (tarda varios min por vídeo).");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
