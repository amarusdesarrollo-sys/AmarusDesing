"use client";

import { useEffect } from "react";
import { getSiteConfig } from "@/lib/firebase/site-config";
import { useCartStore } from "@/store/cartStore";

/**
 * Carga la configuración de envío desde Firestore y la guarda en el store del carrito.
 * Así el coste y el umbral de envío gratis los eliges tú en Admin > Configuración.
 */
export default function ShippingConfigLoader() {
  const setShippingConfig = useCartStore((s) => s.setShippingConfig);

  useEffect(() => {
    getSiteConfig()
      .then((config) => {
        setShippingConfig({
          freeShippingThreshold: config.shipping.freeShippingThreshold ?? 0,
          standardShippingCost: config.shipping.standardShippingCost ?? 0,
          expressShippingCost: config.shipping.expressShippingCost ?? 0,
        });
      })
      .catch(() => {
        setShippingConfig(null);
      });
  }, [setShippingConfig]);

  return null;
}
