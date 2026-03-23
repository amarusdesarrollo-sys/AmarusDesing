/**
 * Email autorizado para acceder al panel de administración.
 * Opcional en Vercel: NEXT_PUBLIC_ADMIN_EMAIL (mismo valor) para cambiar sin tocar código.
 * Avisos de pedido y formulario de contacto: ADMIN_NOTIFY_EMAIL o, si no existe, este email.
 */
export const ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim() ||
  "amarusdesign2014@gmail.com";

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();
}
