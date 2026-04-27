/**
 * Parsea el texto de "Atributos adicionales" del admin (una línea por par).
 * Tolera saltos de línea de iOS/Windows y variantes de ":".
 */
export function parseProductAttributesText(raw: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw?.trim()) return out;

  for (const rawLine of raw.split(/\r?\n/)) {
    let line = rawLine.replace(/\u200e|\u200f/g, "").trim(); // LRM/RLM invisibles (copiar/pegar iOS)
    if (!line) continue;

    // Dos puntos ancho (teclados / pegado desde algunas apps) → ASCII
    line = line.replace(/\uFF1A/g, ":");

    let idx = line.indexOf(":");
    if (idx <= 0) {
      const eq = line.indexOf("=");
      if (eq > 0) {
        const key = line.slice(0, eq).trim();
        const value = line.slice(eq + 1).trim();
        if (key && value) out[key] = value;
      }
      continue;
    }

    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key && value) out[key] = value;
  }

  return out;
}
