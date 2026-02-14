/**
 * Configuración base de SEO. Se usa en layout y en páginas.
 */
export const SITE_NAME = "AmarusDesign";
export const SITE_DESCRIPTION =
  "Descubre joyería artesanal única, minerales del mundo y macramé hecho a mano. Cada pieza cuenta una historia de artesanos apasionados.";
export const SITE_KEYWORDS = [
  "joyería artesanal",
  "minerales",
  "macramé",
  "piedras naturales",
  "joyería única",
  "artesanía",
  "España",
];

export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://amarusdesign.com";
}

export function buildTitle(title?: string): string {
  return title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Joyería Artesanal y Minerales`;
}
