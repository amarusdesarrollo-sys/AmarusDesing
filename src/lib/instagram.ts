/**
 * Extrae el handle de Instagram desde texto suelto, URL con ?utm_… o @handle.
 */
export function normalizeInstagramHandle(raw: string | undefined | null): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "amarusdesign";

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      const host = u.hostname.replace(/^www\./i, "");
      if (host.endsWith("instagram.com")) {
        const seg = u.pathname.split("/").filter(Boolean)[0];
        if (seg) return seg.replace(/^@/, "");
      }
    } catch {
      /* seguir con lógica de texto plano */
    }
  }

  const noQuery = trimmed.split("?")[0].split("#")[0].trim();
  let s = noQuery.replace(/^@/, "");
  s = s.replace(/^https?:\/\/(www\.)?instagram\.com\/?/i, "");
  const parts = s.split("/").filter(Boolean);
  const handle = (parts[0] ?? s).replace(/^@/, "");
  return handle || "amarusdesign";
}

export function instagramProfileUrl(raw: string | undefined | null): string {
  const h = normalizeInstagramHandle(raw);
  return `https://www.instagram.com/${h}/`;
}
