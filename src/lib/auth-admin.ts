/**
 * Email autorizado para acceder al panel de administración.
 * Puedes cambiarlo o usar process.env.NEXT_PUBLIC_ADMIN_EMAIL si lo prefieres.
 */
export const ADMIN_EMAIL = "amarusdesarrollo@gmail.com";

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();
}
