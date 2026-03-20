import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    return NextResponse.json(
      { error: "Falta email" },
      { status: 400 }
    );
  }

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

