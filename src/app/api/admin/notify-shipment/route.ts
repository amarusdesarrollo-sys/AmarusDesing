import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase-admin";
import { hasFirebaseAdminCredentials } from "@/lib/firebase-admin-server";
import { getOrderByIdAdmin } from "@/lib/finalize-paid-order";
import { sendOrderShippedEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult && "json" in authResult) return authResult;

    if (!hasFirebaseAdminCredentials()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Firebase Admin no configurado (FIREBASE_SERVICE_ACCOUNT_KEY o _BASE64 en Vercel). Sin esto el servidor no puede leer el pedido para el email.",
        },
        { status: 503 }
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { orderId?: string; trackingNumber?: string }
      | null;
    const orderId = body?.orderId?.toString().trim();
    const trackingFromClient = body?.trackingNumber?.toString().trim() ?? "";
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Falta orderId" },
        { status: 400 }
      );
    }

    const order = await getOrderByIdAdmin(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    const tracking =
      trackingFromClient || order.trackingNumber?.toString().trim() || "";
    if (!tracking) {
      return NextResponse.json(
        {
          success: false,
          message: "Falta número de seguimiento (guárdalo antes o envíalo en el body).",
        },
        { status: 400 }
      );
    }

    const orderForEmail = { ...order, trackingNumber: tracking };
    const result = await sendOrderShippedEmail(orderForEmail);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: result.error || "No se pudo enviar email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
