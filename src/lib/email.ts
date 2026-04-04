import type { Order } from "@/types";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { SITE_NAME, getBaseUrl } from "./seo";
import { ADMIN_EMAIL } from "./auth-admin";

const formatPrice = (cents: number) => (cents / 100).toFixed(2);

type EmailFrom = { name: string; email: string };

function parseEmailFrom(raw: string | undefined): EmailFrom {
  let v = (raw ?? "").trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  if (!v) return { name: SITE_NAME, email: "noreply@amarusdesign.com" };
  const m = v.match(/^(.*)<([^>]+)>$/);
  if (m) {
    const name = (m[1] || "").trim().replace(/^"|"$/g, "") || SITE_NAME;
    const email = (m[2] || "").trim();
    return { name, email };
  }
  return { name: SITE_NAME, email: v };
}

const getEmailFrom = () => parseEmailFrom(process.env.EMAIL_FROM);

/** POST de envío. Override solo si MailerSend te da otra URL (soporte / data residency). */
function getMailerSendEmailUrl(): string {
  const custom = process.env.MAILERSEND_API_URL?.trim();
  if (custom) return custom.replace(/\/$/, "");
  return "https://api.mailersend.com/v1/email";
}

/** Limpia API keys pegadas en Vercel (Bearer duplicado, comillas, saltos de línea). */
function normalizeSecret(raw: string | undefined): string {
  let k = (raw ?? "").trim().replace(/\r\n/g, "").replace(/\n/g, "");
  if (k.toLowerCase().startsWith("bearer ")) {
    k = k.slice(7).trim();
  }
  if (
    (k.startsWith('"') && k.endsWith('"')) ||
    (k.startsWith("'") && k.endsWith("'"))
  ) {
    k = k.slice(1, -1).trim();
  }
  return k;
}

function mailerSendApiKeyOrExplain(): { key: string } | { error: string } {
  const key = normalizeSecret(process.env.MAILERSEND_API_KEY);
  if (key) return { key };
  return { error: "MAILERSEND_API_KEY no configurada." };
}

type EmailProvider = "resend" | "mailersend" | "smtp";

/**
 * Orden automático (sin EMAIL_PROVIDER): Resend → MailerSend → SMTP.
 * Forzar: EMAIL_PROVIDER=resend | mailersend | smtp | auto
 */
function resolveEmailProvider(): EmailProvider | { error: string } {
  const explicit = (process.env.EMAIL_PROVIDER || "auto").trim().toLowerCase();

  if (explicit === "resend") {
    if (!normalizeSecret(process.env.RESEND_API_KEY)) {
      return { error: "EMAIL_PROVIDER=resend pero falta RESEND_API_KEY en el servidor." };
    }
    return "resend";
  }
  if (explicit === "mailersend") {
    if (!normalizeSecret(process.env.MAILERSEND_API_KEY)) {
      return { error: "EMAIL_PROVIDER=mailersend pero falta MAILERSEND_API_KEY." };
    }
    return "mailersend";
  }
  if (explicit === "smtp") {
    if (
      !process.env.SMTP_HOST?.trim() ||
      !process.env.SMTP_USER?.trim() ||
      !process.env.SMTP_PASS?.trim()
    ) {
      return {
        error:
          "EMAIL_PROVIDER=smtp pero faltan SMTP_HOST, SMTP_USER o SMTP_PASS (y opcional SMTP_PORT=587).",
      };
    }
    return "smtp";
  }
  if (explicit !== "auto") {
    return {
      error: `EMAIL_PROVIDER desconocido: "${explicit}". Usa resend, mailersend, smtp o auto.`,
    };
  }

  if (normalizeSecret(process.env.RESEND_API_KEY)) return "resend";
  if (normalizeSecret(process.env.MAILERSEND_API_KEY)) return "mailersend";
  if (
    process.env.SMTP_HOST?.trim() &&
    process.env.SMTP_USER?.trim() &&
    process.env.SMTP_PASS?.trim()
  ) {
    return "smtp";
  }
  return {
    error:
      "Sin email configurado: añade RESEND_API_KEY, o MAILERSEND_API_KEY, o SMTP_HOST+SMTP_USER+SMTP_PASS (Gmail con contraseña de aplicación). Opcional: EMAIL_PROVIDER=resend|mailersend|smtp. Ver .env.example.",
  };
}

/** Texto plano mínimo para entregabilidad (MailerSend recomienda `text` junto a `html`). */
function htmlToPlainText(html: string): string {
  const t = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return t.slice(0, 100_000) || SITE_NAME;
}

async function sendEmailViaMailerSend(input: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const api = mailerSendApiKeyOrExplain();
  if ("error" in api) {
    console.error("[MailerSend]", api.error);
    return { ok: false, error: api.error };
  }

  const from = getEmailFrom();
  if (!from?.email?.trim()) return { ok: false, error: "EMAIL_FROM no configurado" };

  const plain = htmlToPlainText(input.html);
  const body: Record<string, unknown> = {
    from,
    to: [{ email: input.to.trim() }],
    subject: input.subject,
    html: input.html,
    text: plain,
  };
  /** API MailerSend: `reply_to` es un objeto { email }, no un array. */
  if (input.replyTo?.trim()) {
    body.reply_to = { email: input.replyTo.trim() };
  }

  const emailUrl = getMailerSendEmailUrl();

  try {
    const res = await fetch(emailUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${api.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log("[MailerSend] respuesta HTTP", res.status);

    const sendPaused = res.headers.get("x-send-paused");
    if (sendPaused === "true") {
      const msg =
        "MailerSend devolvió envío en pausa (x-send-paused). Revisa en el panel: dominio, límites y estado de la cuenta.";
      console.error("[MailerSend]", msg);
      return { ok: false, error: msg };
    }

    const rawBody = await res.text().catch(() => "");

    if (res.status === 401) {
      console.error("[MailerSend] 401 Unauthenticated — revisa MAILERSEND_API_KEY en Vercel (token completo mlsn…, sin 'Bearer ', sin comillas, redeploy tras guardar).");
      return {
        ok: false,
        error: `MailerSend HTTP 401 - ${rawBody || "Unauthenticated."} Revisa en Vercel que MAILERSEND_API_KEY sea el token completo copiado desde MailerSend (solo el valor mlsn…, sin prefijo Bearer ni comillas). Vuelve a desplegar tras guardar.`,
      };
    }

    if (res.status === 403) {
      console.error("[MailerSend] 403", rawBody);
      return {
        ok: false,
        error: `MailerSend 403 — el token no tiene permiso o la cuenta está restringida. ${rawBody?.slice(0, 600) || "Crea un token con «Sending access»."}`,
      };
    }

    if (res.status === 422) {
      console.error("[MailerSend] 422", rawBody);
      return {
        ok: false,
        error: `MailerSend rechazó el envío (422). ${rawBody || "Revisa dominio remitente verificado y EMAIL_FROM."}`,
      };
    }

    if (res.status === 202 || res.status === 200) {
      if (rawBody.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(rawBody) as {
            warnings?: Array<{ type?: string; warning?: string }>;
            message?: string;
          };
          if (parsed.warnings?.length) {
            console.warn("[MailerSend] respuesta con advertencias:", parsed.warnings);
            const w = JSON.stringify(parsed.warnings);
            if (/suppressed|blocklisted|invalid/i.test(w)) {
              return {
                ok: false,
                error: `MailerSend: problema con el destinatario. ${parsed.message || w.slice(0, 400)}`,
              };
            }
          }
        } catch {
          /* cuerpo no JSON */
        }
      }
      const msgId = res.headers.get("x-message-id");
      if (msgId) {
        console.log("[MailerSend] aceptado", { x_message_id: msgId, to: input.to.trim() });
      }
      return { ok: true };
    }

    console.error("[MailerSend] HTTP", res.status, rawBody);
    return {
      ok: false,
      error: `MailerSend HTTP ${res.status}${rawBody ? ` - ${rawBody.slice(0, 800)}` : ""}`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return { ok: false, error: msg };
  }
}

async function sendEmailViaResend(input: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const key = normalizeSecret(process.env.RESEND_API_KEY);
  if (!key) return { ok: false, error: "RESEND_API_KEY no configurada" };

  const from = getEmailFrom();
  if (!from?.email?.trim()) return { ok: false, error: "EMAIL_FROM no configurado" };

  const fromStr = `${from.name} <${from.email}>`.replace(/\s+/g, " ").trim();

  try {
    const resend = new Resend(key);
    const { data, error } = await resend.emails.send({
      from: fromStr,
      to: [input.to.trim()],
      subject: input.subject,
      html: input.html,
      text: htmlToPlainText(input.html),
      ...(input.replyTo?.trim() ? { replyTo: input.replyTo.trim() } : {}),
    });

    if (error) {
      const msg =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : JSON.stringify(error);
      console.error("[Resend]", error);
      return { ok: false, error: `Resend: ${msg}` };
    }
    console.log("[Resend] enviado", { id: data?.id, to: input.to.trim() });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Resend]", err);
    return { ok: false, error: msg };
  }
}

async function sendEmailViaSmtp(input: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) {
    return { ok: false, error: "SMTP_HOST, SMTP_USER y SMTP_PASS son obligatorios" };
  }

  const port = Number.parseInt(process.env.SMTP_PORT || "587", 10);
  const secure =
    process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1" || port === 465;

  const from = getEmailFrom();
  if (!from?.email?.trim()) return { ok: false, error: "EMAIL_FROM no configurado" };

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"${from.name.replace(/"/g, "")}" <${from.email}>`,
      to: input.to.trim(),
      subject: input.subject,
      html: input.html,
      text: htmlToPlainText(input.html),
      ...(input.replyTo?.trim() ? { replyTo: input.replyTo.trim() } : {}),
    });
    console.log("[SMTP] enviado", { host, to: input.to.trim() });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[SMTP]", msg);
    return { ok: false, error: `SMTP: ${msg}` };
  }
}

function isEmailProviderError(
  x: EmailProvider | { error: string }
): x is { error: string } {
  return typeof x === "object" && x !== null && "error" in x;
}

async function sendEmailUnified(input: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const resolved = resolveEmailProvider();
  if (isEmailProviderError(resolved)) {
    console.error("[email]", resolved.error);
    return { ok: false, error: resolved.error };
  }
  console.log("[email] proveedor:", resolved);
  switch (resolved) {
    case "resend":
      return sendEmailViaResend(input);
    case "mailersend":
      return sendEmailViaMailerSend(input);
    case "smtp":
      return sendEmailViaSmtp(input);
  }
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** URL absoluta del logo para clientes de correo (requiere NEXT_PUBLIC_SITE_URL en producción). */
function getEmailLogoUrl(): string {
  const base = getBaseUrl().replace(/\/$/, "");
  return `${base}/images/logo.avif`;
}

/** Cabecera con logo redondo encima del contenido del email. */
function emailLogoHeader(): string {
  const src = escapeHtml(getEmailLogoUrl());
  const alt = escapeHtml(SITE_NAME);
  return `
      <div style="text-align:center; margin-bottom:20px;">
        <img src="${src}" alt="${alt}" width="72" height="72" style="display:inline-block; border-radius:9999px; vertical-align:middle;" />
      </div>`;
}

/** Envía email de confirmación de pedido al cliente tras pago exitoso */
export async function sendOrderConfirmationEmail(order: Order): Promise<{
  ok: boolean;
  error?: string;
}> {
  const to = order.customerEmail;
  if (!to?.trim()) {
    return { ok: false, error: "No hay email de cliente" };
  }

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
      ${emailLogoHeader()}
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
    const result = await sendEmailUnified({
      to: to.trim(),
      subject: `Confirmación de pedido #${order.id} - ${SITE_NAME}`,
      html,
    });
    if (!result.ok) console.error("Error enviando email:", result.error);
    return result;
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
  const to = process.env.ADMIN_NOTIFY_EMAIL || ADMIN_EMAIL;
  if (!to?.trim()) {
    return { ok: false, error: "No hay email de admin" };
  }

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
      ${emailLogoHeader()}
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
        <a href="${getBaseUrl().replace(/\/$/, "")}/admin/pedidos/${order.id}" style="display:inline-block; background:#6B5BB6; color:white; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:600;">Ver pedido en el admin</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

  try {
    const result = await sendEmailUnified({
      to: to.trim(),
      subject: `[${SITE_NAME}] Nuevo pedido #${order.id} — €${formatPrice(order.total)}`,
      html,
    });
    if (!result.ok) console.error("Error enviando aviso a admin:", result.error);
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error enviando aviso a admin:", err);
    return { ok: false, error: msg };
  }
}

export async function sendContactMessageToAdmin(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  const to = process.env.ADMIN_NOTIFY_EMAIL || ADMIN_EMAIL;
  if (!to?.trim()) return { ok: false, error: "No hay email de admin" };

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Nuevo mensaje de contacto</title></head>
<body style="margin:0; padding:0; font-family: system-ui, sans-serif; background:#f5f5f5;">
  <div style="max-width:560px; margin:0 auto; padding:24px;">
    <div style="background:white; border-radius:12px; padding:24px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      ${emailLogoHeader()}
      <h1 style="margin:0 0 12px; font-size:20px; color:#1a1a1a;">Nuevo mensaje de contacto</h1>
      <p style="margin:0 0 8px; color:#666;"><strong>Nombre:</strong> ${escapeHtml(
        input.name
      )}</p>
      <p style="margin:0 0 8px; color:#666;"><strong>Email:</strong> ${escapeHtml(
        input.email
      )}</p>
      <p style="margin:0 0 12px; color:#666;"><strong>Asunto:</strong> ${escapeHtml(
        input.subject
      )}</p>
      <div style="padding:12px; background:#f9f9f9; border-radius:8px; white-space:pre-wrap; color:#333;">${escapeHtml(
        input.message
      )}</div>
    </div>
    <p style="margin:16px 0 0; text-align:center; color:#999; font-size:12px;">
      ${SITE_NAME}
    </p>
  </div>
</body>
</html>`;

  try {
    return await sendEmailUnified({
      to: to.trim(),
      replyTo: input.email.trim(),
      subject: `[${SITE_NAME}] Contacto: ${input.subject}`,
      html,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return { ok: false, error: msg };
  }
}

export async function sendContactConfirmationToUser(input: {
  name: string;
  email: string;
  subject: string;
}): Promise<{ ok: boolean; error?: string }> {
  const to = input.email;
  if (!to?.trim()) return { ok: false, error: "No hay email" };

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Hemos recibido tu mensaje</title></head>
<body style="margin:0; padding:0; font-family: system-ui, sans-serif; background:#f5f5f5;">
  <div style="max-width:560px; margin:0 auto; padding:24px;">
    <div style="background:white; border-radius:12px; padding:24px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      ${emailLogoHeader()}
      <h1 style="margin:0 0 12px; font-size:20px; color:#1a1a1a;">¡Gracias por escribirnos!</h1>
      <p style="margin:0 0 12px; color:#666;">Hola ${escapeHtml(
        input.name || "!"
      )}, recibimos tu mensaje sobre <strong>${escapeHtml(
        input.subject
      )}</strong>. Te responderemos lo antes posible.</p>
      <p style="margin:0; color:#888; font-size:13px;">${SITE_NAME}</p>
    </div>
  </div>
</body>
</html>`;

  try {
    return await sendEmailUnified({
      to: to.trim(),
      subject: `Recibimos tu mensaje - ${SITE_NAME}`,
      html,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return { ok: false, error: msg };
  }
}

export async function sendWelcomeEmail(input: {
  name?: string;
  email: string;
}): Promise<{ ok: boolean; error?: string }> {
  const to = input.email;
  if (!to?.trim()) return { ok: false, error: "No hay email" };

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Bienvenida</title></head>
<body style="margin:0; padding:0; font-family: system-ui, sans-serif; background:#f5f5f5;">
  <div style="max-width:560px; margin:0 auto; padding:24px;">
    <div style="background:white; border-radius:12px; padding:24px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      ${emailLogoHeader()}
      <h1 style="margin:0 0 12px; font-size:20px; color:#1a1a1a;">¡Bienvenid@ a ${SITE_NAME}!</h1>
      <p style="margin:0; color:#666;">Hola ${escapeHtml(
        input.name || ""
      )} 👋 Gracias por registrarte. Ya puedes ver tus pedidos y guardar tus datos para futuras compras.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    return await sendEmailUnified({
      to: to.trim(),
      subject: `Bienvenid@ a ${SITE_NAME}`,
      html,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return { ok: false, error: msg };
  }
}

export async function sendOrderShippedEmail(order: Order): Promise<{
  ok: boolean;
  error?: string;
}> {
  const to = order.customerEmail;
  if (!to?.trim()) return { ok: false, error: "No hay email de cliente" };
  if (!order.trackingNumber?.trim()) {
    return { ok: false, error: "No hay número de seguimiento" };
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Tu pedido está en camino</title></head>
<body style="margin:0; padding:0; font-family: system-ui, sans-serif; background:#f5f5f5;">
  <div style="max-width:560px; margin:0 auto; padding:24px;">
    <div style="background:white; border-radius:12px; padding:24px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      ${emailLogoHeader()}
      <h1 style="margin:0 0 12px; font-size:22px; color:#1a1a1a;">Tu pedido ya está en camino</h1>
      <p style="margin:0 0 16px; color:#666;">
        Hola ${escapeHtml(
          order.customerGivenName || order.customerName || "cliente"
        )}, tu pedido <strong>#${escapeHtml(order.id)}</strong> ha sido enviado.
      </p>
      <p style="margin:0 0 12px; color:#333;"><strong>Número de seguimiento:</strong></p>
      <p style="margin:0 0 16px; padding:12px; background:#f5efff; border-radius:8px; font-family:monospace; font-size:16px; color:#6B5BB6;">
        ${escapeHtml(order.trackingNumber)}
      </p>
      <p style="margin:0; color:#888; font-size:13px;">
        Gracias por confiar en ${SITE_NAME}. Si tienes dudas, responde a este correo.
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    return await sendEmailUnified({
      to: to.trim(),
      subject: `Tu pedido #${order.id} está en camino - ${SITE_NAME}`,
      html,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return { ok: false, error: msg };
  }
}
