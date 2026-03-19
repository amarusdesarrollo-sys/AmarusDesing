import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  sendContactConfirmationToUser,
  sendContactMessageToAdmin,
} from "@/lib/email";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  subject: z.string().trim().min(2).max(120),
  message: z.string().trim().min(5).max(5000),
  // honeypot (optional)
  website: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = contactSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Datos inválidos" },
        { status: 400 }
      );
    }

    // Honeypot: si el bot lo llena, respondemos OK sin enviar emails
    if (parsed.data.website && parsed.data.website.trim().length > 0) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const { name, email, subject, message } = parsed.data;

    const [adminRes, userRes] = await Promise.all([
      sendContactMessageToAdmin({ name, email, subject, message }),
      sendContactConfirmationToUser({ name, email, subject }),
    ]);

    // Si falla el admin pero el usuario fue OK (o viceversa), igual respondemos success
    // para no filtrar estado de configuración y evitar fricción.
    if (!adminRes.ok || !userRes.ok) {
      console.warn("Contact email partial failure", {
        admin: adminRes,
        user: userRes,
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Error en /api/contact:", err);
    return NextResponse.json(
      { success: false, message: "Error enviando el mensaje" },
      { status: 500 }
    );
  }
}

