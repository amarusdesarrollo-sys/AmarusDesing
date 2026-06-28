import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFirebaseAdminApp } from "@/lib/firebase-admin-server";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const subscribeSchema = z.object({
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  email: z.string().trim().email().max(200),
  website: z.string().optional(),
});

function emailDocId(email: string): string {
  return createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = subscribeSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Revisa el email e inténtalo de nuevo." },
        { status: 400 }
      );
    }

    if (parsed.data.website?.trim()) {
      return NextResponse.json({ success: true, alreadySubscribed: false });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const firstName = parsed.data.firstName?.trim() || "";
    const lastName = parsed.data.lastName?.trim() || "";

    const app = getFirebaseAdminApp();
    const db = getFirestore(app);
    const ref = db.collection("newsletter_subscribers").doc(emailDocId(email));
    const existing = await ref.get();

    if (existing.exists) {
      return NextResponse.json({
        success: true,
        alreadySubscribed: true,
        message: "Este email ya estaba suscrito. ¡Gracias!",
      });
    }

    await ref.set({
      email,
      firstName,
      lastName,
      source: "home",
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      alreadySubscribed: false,
      message: "¡Gracias! Te avisaremos de nuestras novedades.",
    });
  } catch (error) {
    console.error("newsletter subscribe:", error);
    return NextResponse.json(
      {
        success: false,
        message: "No se pudo completar la suscripción. Inténtalo más tarde.",
      },
      { status: 500 }
    );
  }
}
