import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/firebase-admin";
import { sendWelcomeEmail } from "@/lib/email";

/**
 * Solo el usuario autenticado puede pedir su propio email de bienvenida
 * (el destinatario es siempre el email del token, no el body).
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const email = auth.email?.trim().toLowerCase() ?? "";
  if (!email) {
    return NextResponse.json(
      { error: "No hay email en el token" },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const name =
    typeof body?.name === "string" ? body.name.trim().slice(0, 120) : undefined;

  const res = await sendWelcomeEmail({ email, name });
  if (!res.ok) {
    return NextResponse.json(
      { success: false, error: res.error || "No se pudo enviar" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
