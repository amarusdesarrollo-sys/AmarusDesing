/**
 * Solo para uso en el cliente (admin). Obtiene el token de Firebase para enviarlo en las APIs protegidas.
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const { auth } = await import("@/lib/firebase");
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}
