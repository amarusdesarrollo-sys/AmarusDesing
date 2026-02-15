import { Resend } from "resend";
import type { Order } from "@/types";
import { SITE_NAME } from "./seo";
import { ADMIN_EMAIL } from "./auth-admin";

const formatPrice = (cents: number) => (cents / 100).toFixed(2);

/** Envía email de confirmación de pedido al cliente tras pago exitoso */
export async function sendOrderConfirmationEmail(order: Order): Promise<{
  ok: boolean;
  error?: string;
}> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY no configurada, no se envía email");
    return { ok: false, error: "Email no configurado" };
  }

  const resend = new Resend(apiKey);

  const to = order.customerEmail;
  if (!to?.trim()) {
    return { ok: false, error: "No hay email de cliente" };
  }

  const from =
    process.env.EMAIL_FROM || "onboarding@resend.dev";

  const itemsHtml = order.items
    .map(
      (i) =>
        `<tr><td>${i.product.name}</td><td>${i.quantity}</td><td>€${formatPrice(i.price)}</td><td>€${formatPrice(i.price * i.quantity)}</td></tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de pedido</title>
</head>
<body style="margin:0; padding:0; font-family: system-ui, -apple-system, sans-serif; background:#f5f5f5;">
  <div style="max-width:560px; margin:0 auto; padding:24px;">
    <div style="background:white; border-radius:12px; padding:32px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <h1 style="margin:0 0 8px; font-size:24px; color:#1a1a1a;">¡Gracias por tu compra!</h1>
      <p style="margin:0 0 24px; color:#666; font-size:16px;">
        Hola ${order.customerGivenName || order.customerName || "cliente"}, tu pedido ha sido confirmado.
      </p>
      <p style="margin:0 0 20px; padding:12px; background:#f5efff; border-radius:8px; font-family:monospace; font-size:14px; color:#6B5BB6;">
        <strong>Nº de pedido:</strong> ${order.id}
      </p>
      <h2 style="margin:24px 0 12px; font-size:18px; color:#333;">Resumen</h2>
      <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
        <thead>
          <tr style="border-bottom:2px solid #eee;">
            <th style="text-align:left; padding:8px 0; color:#666; font-size:13px;">Producto</th>
            <th style="text-align:center; padding:8px 0; color:#666; font-size:13px;">Cant.</th>
            <th style="text-align:right; padding:8px 0; color:#666; font-size:13px;">P.Unit</th>
            <th style="text-align:right; padding:8px 0; color:#666; font-size:13px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <div style="border-top:1px solid #eee; padding-top:16px;">
        <p style="margin:4px 0; display:flex; justify-content:space-between;"><span>Subtotal</span><span>€${formatPrice(order.items.reduce((s, i) => s + i.price * i.quantity, 0))}</span></p>
        <p style="margin:4px 0; display:flex; justify-content:space-between;"><span>Envío</span><span>${order.shipping === 0 ? "Gratis" : `€${formatPrice(order.shipping)}`}</span></p>
        <p style="margin:12px 0 0; display:flex; justify-content:space-between; font-size:18px; font-weight:bold; color:#6B5BB6;"><span>Total</span><span>€${formatPrice(order.total)}</span></p>
      </div>
      <div style="margin-top:24px; padding-top:20px; border-top:1px solid #eee;">
        <p style="margin:0 0 8px; font-weight:600; color:#333;">Dirección de envío</p>
        <p style="margin:0; color:#666; line-height:1.6;">
          ${order.customerName || ""}<br/>
          ${order.shippingAddress.street}${order.shippingAddress.street2 ? `, ${order.shippingAddress.street2}` : ""}<br/>
          ${order.shippingAddress.postalCode} ${order.shippingAddress.city}${order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""}<br/>
          ${order.shippingAddress.country}
        </p>
      </div>
      <p style="margin:24px 0 0; color:#888; font-size:13px;">
        ¿Alguna duda? Responde a este email o contacta con nosotros.
      </p>
    </div>
    <p style="margin:16px 0 0; text-align:center; color:#999; font-size:12px;">
      ${SITE_NAME}
    </p>
  </div>
</body>
</html>
`;

  try {
    const { data, error } = await resend.emails.send({
      from: `${SITE_NAME} <${from}>`,
      to: [to.trim()],
      subject: `Confirmación de pedido #${order.id} - ${SITE_NAME}`,
      html,
    });

    if (error) {
      console.error("Error enviando email:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error enviando email de confirmación:", err);
    return { ok: false, error: msg };
  }
}

/** Envía al admin un aviso de nuevo pedido (tras pago exitoso). */
export async function sendNewOrderAlertToAdmin(order: Order): Promise<{
  ok: boolean;
  error?: string;
}> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Email no configurado" };
  }

  const to = process.env.ADMIN_NOTIFY_EMAIL || ADMIN_EMAIL;
  if (!to?.trim()) {
    return { ok: false, error: "No hay email de admin" };
  }

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM || "onboarding@resend.dev";

  const itemsList = order.items
    .map((i) => `• ${i.product.name} × ${i.quantity} — €${formatPrice(i.price * i.quantity)}`)
    .join("\n");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Nuevo pedido</title></head>
<body style="margin:0; padding:0; font-family: system-ui, sans-serif; background:#f5f5f5;">
  <div style="max-width:560px; margin:0 auto; padding:24px;">
    <div style="background:white; border-radius:12px; padding:24px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <h1 style="margin:0 0 16px; font-size:20px; color:#1a1a1a;">🛒 Nuevo pedido recibido</h1>
      <p style="margin:0 0 12px; color:#333;"><strong>Pedido #${order.id}</strong></p>
      <p style="margin:0 0 8px; color:#666;">Cliente: ${order.customerName || "—"} &lt;${order.customerEmail || "—"}&gt;</p>
      ${order.customerPhone ? `<p style="margin:0 0 12px; color:#666;">Tel: ${order.customerPhone}</p>` : ""}
      <p style="margin:0 0 4px; color:#666; font-size:14px;">Productos:</p>
      <pre style="margin:0 0 12px; padding:12px; background:#f9f9f9; border-radius:8px; font-size:13px; white-space:pre-wrap;">${itemsList}</pre>
      <p style="margin:0 0 4px; color:#666;">Total: <strong style="color:#6B5BB6;">€${formatPrice(order.total)}</strong></p>
      <p style="margin:12px 0 0; color:#888; font-size:13px;">
        Dirección: ${order.shippingAddress.street}, ${order.shippingAddress.postalCode} ${order.shippingAddress.city}, ${order.shippingAddress.country}
      </p>
      <p style="margin:16px 0 0;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://amarus-desing.vercel.app"}/admin/pedidos/${order.id}" style="display:inline-block; background:#6B5BB6; color:white; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:600;">Ver pedido en el admin</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

  try {
    const { error } = await resend.emails.send({
      from: `${SITE_NAME} <${from}>`,
      to: [to.trim()],
      subject: `[${SITE_NAME}] Nuevo pedido #${order.id} — €${formatPrice(order.total)}`,
      html,
    });
    if (error) {
      console.error("Error enviando aviso a admin:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error enviando aviso a admin:", err);
    return { ok: false, error: msg };
  }
}
