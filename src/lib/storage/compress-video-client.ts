"use client";

import { VIDEO_COMPRESS_PROFILE } from "@/lib/storage/compress-video-profile";

export type VideoCompressProgress = {
  phase: "loading" | "compressing";
  progress: number;
  message: string;
};

let ffmpegLoadPromise: Promise<import("@ffmpeg/ffmpeg").FFmpeg> | null = null;

async function getFfmpeg(
  onProgress?: (p: VideoCompressProgress) => void
): Promise<import("@ffmpeg/ffmpeg").FFmpeg> {
  if (ffmpegLoadPromise) return ffmpegLoadPromise;

  ffmpegLoadPromise = (async () => {
    onProgress?.({
      phase: "loading",
      progress: 0,
      message: "Preparando compresor de vídeo…",
    });

    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { toBlobURL } = await import("@ffmpeg/util");
    const ffmpeg = new FFmpeg();

    ffmpeg.on("progress", ({ progress }) => {
      onProgress?.({
        phase: "compressing",
        progress: Math.min(0.99, Math.max(0, progress)),
        message: `Comprimiendo vídeo… ${Math.round(progress * 100)}%`,
      });
    });

    const coreVersion = "0.12.6";
    const baseURL = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${coreVersion}/dist/esm`;

    await ffmpeg.load({
      coreURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.js`,
        "text/javascript"
      ),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });

    return ffmpeg;
  })();

  return ffmpegLoadPromise;
}

function inputNameForFile(file: File): string {
  const ext = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf("."))
    : ".mp4";
  return `input${ext.toLowerCase()}`;
}

function ffmpegArgs(inputName: string, includeAudio: boolean): string[] {
  const { maxWidth, crf, audioBitrate, preset } = VIDEO_COMPRESS_PROFILE;
  const args = [
    "-i",
    inputName,
    "-c:v",
    "libx264",
    "-preset",
    preset,
    "-crf",
    String(crf),
    "-movflags",
    "+faststart",
    "-vf",
    `scale='min(${maxWidth},iw)':-2`,
    "-pix_fmt",
    "yuv420p",
  ];
  if (includeAudio) {
    args.push("-c:a", "aac", "-b:a", audioBitrate);
  } else {
    args.push("-an");
  }
  args.push(`output.${VIDEO_COMPRESS_PROFILE.outputExt}`);
  return args;
}

function compressedFileName(original: File): string {
  const stem = original.name.includes(".")
    ? original.name.slice(0, original.name.lastIndexOf("."))
    : original.name;
  return `${stem}.${VIDEO_COMPRESS_PROFILE.outputExt}`;
}

/**
 * Comprime un vídeo en el navegador antes de subirlo a Supabase.
 * Mismo perfil que el script batch (H.264, máx. 1280px, CRF 28).
 */
export async function compressVideoForWeb(
  file: File,
  onProgress?: (p: VideoCompressProgress) => void
): Promise<File> {
  if (file.size < VIDEO_COMPRESS_PROFILE.minBytesToCompress) {
    return file;
  }

  const { fetchFile } = await import("@ffmpeg/util");
  const ffmpeg = await getFfmpeg(onProgress);
  const inputName = inputNameForFile(file);
  const outName = `output.${VIDEO_COMPRESS_PROFILE.outputExt}`;

  onProgress?.({
    phase: "compressing",
    progress: 0,
    message: "Comprimiendo vídeo…",
  });

  await ffmpeg.writeFile(inputName, await fetchFile(file));

  let exitCode = await ffmpeg.exec(ffmpegArgs(inputName, true));
  if (exitCode !== 0) {
    exitCode = await ffmpeg.exec(ffmpegArgs(inputName, false));
    if (exitCode !== 0) {
      await ffmpeg.deleteFile(inputName).catch(() => {});
      throw new Error(
        "No se pudo comprimir el vídeo. Prueba con MP4/MOV en H.264 o un archivo más corto."
      );
    }
  }

  const data = await ffmpeg.readFile(outName);
  const bytes =
    typeof data === "string"
      ? new TextEncoder().encode(data)
      : new Uint8Array(data);

  await ffmpeg.deleteFile(inputName).catch(() => {});
  await ffmpeg.deleteFile(outName).catch(() => {});

  const compressed = new File([bytes], compressedFileName(file), {
    type: VIDEO_COMPRESS_PROFILE.outputMime,
    lastModified: Date.now(),
  });

  const savings = 1 - compressed.size / file.size;
  if (
    compressed.size >= file.size ||
    savings < VIDEO_COMPRESS_PROFILE.minSavingsRatio
  ) {
    return file;
  }

  onProgress?.({
    phase: "compressing",
    progress: 1,
    message: "Vídeo comprimido",
  });

  return compressed;
}
