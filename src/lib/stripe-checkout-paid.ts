import type Stripe from "stripe";

/**
 * Stripe Checkout puede quedar `payment_status: unpaid` al volver del navegador o en
 * `checkout.session.completed` con métodos diferidos (p. ej. Klarna). El PaymentIntent
 * `succeeded` es la señal fiable cuando está expandido en la sesión.
 */
export function checkoutSessionIndicatesPaid(session: Stripe.Checkout.Session): boolean {
  if (
    session.payment_status === "paid" ||
    session.payment_status === "no_payment_required"
  ) {
    return true;
  }
  const pi = session.payment_intent;
  if (typeof pi === "object" && pi !== null && "status" in pi) {
    const st = (pi as Stripe.PaymentIntent).status;
    if (st === "succeeded") return true;
  }
  return false;
}
