"use client";

import { useEffect } from "react";
import { getSiteConfig } from "@/lib/firebase/site-config";
import { useCartStore } from "@/store/cartStore";
import type { SiteConfig } from "@/types";

function applyShippingConfig(
  setShippingConfig: ReturnType<typeof useCartStore.getState>["setShippingConfig"],
  config: SiteConfig
) {
  setShippingConfig({
    freeShippingThreshold: config.shipping.freeShippingThreshold ?? 0,
    standardShippingCost: config.shipping.standardShippingCost ?? 0,
    expressShippingCost: config.shipping.expressShippingCost ?? 0,
    zones: config.shipping.zones,
  });
}

export default function ShippingConfigLoader({
  initialSiteConfig = null,
}: {
  initialSiteConfig?: SiteConfig | null;
}) {
  const setShippingConfig = useCartStore((s) => s.setShippingConfig);

  useEffect(() => {
    if (initialSiteConfig) {
      applyShippingConfig(setShippingConfig, initialSiteConfig);
      return;
    }
    getSiteConfig()
      .then((config) => applyShippingConfig(setShippingConfig, config))
      .catch(() => setShippingConfig(null));
  }, [initialSiteConfig, setShippingConfig]);

  return null;
}
