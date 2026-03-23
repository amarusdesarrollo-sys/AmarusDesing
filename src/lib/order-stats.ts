import type { Order, OrderStatus } from "@/types";

/** Estados en los que el pedido ya está pagado y cuenta como ingreso. */
const REVENUE_STATUSES: ReadonlySet<OrderStatus> = new Set([
  "confirmed",
  "processing",
  "shipped",
  "delivered",
]);

/** true si el pedido representa venta cobrada (no pendiente de pago ni cancelado). */
export function orderCountsAsRevenue(order: Order): boolean {
  return REVENUE_STATUSES.has(order.status);
}

/** Suma de `total` (céntimos) de pedidos que ya generaron ingreso. */
export function totalRevenueCents(orders: Order[]): number {
  return orders
    .filter(orderCountsAsRevenue)
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
}

/** Pendiente de pago (Stripe / checkout sin completar). */
export function isAwaitingPayment(order: Order): boolean {
  return order.status === "pending";
}

/** Pagado: aún por preparar / enviar (útil para alertas al admin). */
export function isAwaitingFulfillment(order: Order): boolean {
  return order.status === "confirmed" || order.status === "processing";
}
