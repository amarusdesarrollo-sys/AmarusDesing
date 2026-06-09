const ALLOWED_FOLDERS = [
  "categories",
  "products",
  "team",
  "blog",
  "content",
] as const;

export type StorageFolder = (typeof ALLOWED_FOLDERS)[number];

export function isAllowedStorageFolder(folder: string): folder is StorageFolder {
  return (ALLOWED_FOLDERS as readonly string[]).includes(folder);
}

export function sanitizeFileStem(name: string): string {
  return name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .toLowerCase()
    .substring(0, 50);
}

export function extensionFromFile(file: File, isVideo: boolean): string {
  const lower = (file.name || "").toLowerCase();
  const match = lower.match(/(\.[a-z0-9]+)$/i);
  if (match) return match[1].replace(".", "");
  const mime = (file.type || "").split("/")[1]?.split(";")[0];
  if (mime) return mime === "quicktime" ? "mov" : mime;
  return isVideo ? "mp4" : "jpg";
}

/** Ruta dentro del bucket: `{folder}/{sub?}/{timestamp}-{stem}.{ext}` */
export function buildStoragePath(
  folder: StorageFolder,
  file: File,
  isVideo: boolean
): string {
  const stem = sanitizeFileStem(file.name || "file");
  const ext = extensionFromFile(file, isVideo);
  const ts = Date.now();
  const sub = isVideo && folder === "products" ? "videos" : null;
  return sub
    ? `${folder}/${sub}/${ts}-${stem}.${ext}`
    : `${folder}/${ts}-${stem}.${ext}`;
}
