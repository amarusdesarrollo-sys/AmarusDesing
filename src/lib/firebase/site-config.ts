import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { SiteConfig } from "@/types";

const DOC_ID = "site-config";

const convertTimestamp = (timestamp: unknown): Date => {
  if (timestamp && typeof timestamp === "object" && "toDate" in timestamp) {
    return (timestamp as { toDate: () => Date }).toDate();
  }
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === "string") return new Date(timestamp);
  return new Date();
};

function firestoreToSiteConfig(data: any): SiteConfig {
  return {
    name: data.name || "AmarusDesign",
    description: data.description || "",
    logo: data.logo || "",
    favicon: data.favicon || "",
    socialMedia: {
      instagram: data.socialMedia?.instagram || "",
      email: data.socialMedia?.email || "",
    },
    contact: {
      email: data.contact?.email || "",
      phone: data.contact?.phone || "",
      address: data.contact?.address || {
        street: "",
        city: "",
        postalCode: "",
        country: "",
      },
    },
    shipping: {
      // Sin valores por defecto: hasta que no los guardes en Configuración, envío = 0 y no hay umbral de envío gratis
      freeShippingThreshold: data.shipping?.freeShippingThreshold ?? 0,
      standardShippingCost: data.shipping?.standardShippingCost ?? 0,
      expressShippingCost: data.shipping?.expressShippingCost ?? 0,
    },
  };
}

// Firestore no acepta undefined; normalizar a string vacío o número
function siteConfigToFirestore(config: SiteConfig): Record<string, unknown> {
  const addr = config.contact?.address ?? {};
  return {
    name: config.name ?? "",
    description: config.description ?? "",
    logo: config.logo ?? "",
    favicon: config.favicon ?? "",
    socialMedia: {
      instagram: config.socialMedia?.instagram ?? "",
      email: config.socialMedia?.email ?? "",
    },
    contact: {
      email: config.contact?.email ?? "",
      phone: config.contact?.phone ?? "",
      address: {
        street: addr.street ?? "",
        city: addr.city ?? "",
        postalCode: addr.postalCode ?? "",
        country: addr.country ?? "",
        state: addr.state ?? "",
      },
    },
    shipping: {
      freeShippingThreshold: config.shipping?.freeShippingThreshold ?? 0,
      standardShippingCost: config.shipping?.standardShippingCost ?? 0,
      expressShippingCost: config.shipping?.expressShippingCost ?? 0,
    },
    updatedAt: Timestamp.now(),
  };
}

/** Obtiene la configuración del sitio */
export async function getSiteConfig(): Promise<SiteConfig> {
  const ref = doc(db, "config", DOC_ID);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return firestoreToSiteConfig({});
  }
  return firestoreToSiteConfig(snap.data());
}

/** Actualiza la configuración del sitio */
export async function updateSiteConfig(config: Partial<SiteConfig>): Promise<void> {
  const ref = doc(db, "config", DOC_ID);
  const current = await getSiteConfig();
  const updated = { ...current, ...config };
  await setDoc(ref, siteConfigToFirestore(updated), { merge: true });
}
