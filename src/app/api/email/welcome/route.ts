import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/firebase-admin";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const user = await requireUser(request);
  if ("error" in user) {
    return NextResponse.json({ error: user.error }, { status: user.status });
  }

  const email = user.email;
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

