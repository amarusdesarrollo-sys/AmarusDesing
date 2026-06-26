/** Perfil compartido con scripts/recompress-supabase-videos.mjs */
export const VIDEO_COMPRESS_PROFILE = {
  maxWidth: 1280,
  crf: 28,
  audioBitrate: "128k",
  preset: "medium",
  outputMime: "video/mp4",
  outputExt: "mp4",
  /** No comprimir vídeos ya pequeños */
  minBytesToCompress: 512 * 1024,
  /** Si el ahorro es menor, se sube el original */
  minSavingsRatio: 0.1,
} as const;
