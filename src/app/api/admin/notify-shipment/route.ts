import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase-admin";
import { getOrderById } from "@/lib/firebase/orders";
import { sendOrderShippedEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult && "json" in authResult) return authResult;

    const body = (await request.json().catch(() => null)) as
      | { orderId?: string }
      | null;
    const orderId = body?.orderId?.toString().trim();
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Falta orderId" },
        { status: 400 }
      );
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    const result = await sendOrderShippedEmail(order);
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
