import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import type { SavedAddress } from "@/types";

/** Perfil de usuario guardado en Firestore (campos alineados con Klarna). */
export interface UserProfile {
  /** Nombre (Klarna: given_name). */
  firstName: string;
  /** Apellidos (Klarna: family_name). */
  lastName: string;
  email: string;
  phone: string;
  addresses: SavedAddress[];
  /** Si true, usar la dirección de envío por defecto también para facturación. */
  useSameAddressForBilling: boolean;
  updatedAt: Date;
}

const COLLECTION = "users";

function firestoreToProfile(data: Record<string, unknown> | null): UserProfile | null {
  if (!data || typeof data !== "object") return null;
  const rawAddresses = (data.addresses as unknown[]) ?? [];
  const addresses: SavedAddress[] = rawAddresses.map((a: any) => ({
    id: a.id ?? "",
    type: a.type === "billing" ? "billing" : "shipping",
    street: a.street ?? "",
    street2: a.street2,
    postalCode: a.postalCode ?? "",
    city: a.city ?? "",
    region: a.region,
    country: (a.country ?? "").toString().toUpperCase().slice(0, 2) || "ES",
    isDefault: Boolean(a.isDefault),
  }));
  const firstName = (data.firstName as string) ?? (data.name as string) ?? "";
  return {
    firstName,
    lastName: (data.lastName as string) ?? "",
    email: (data.email as string) ?? "",
    phone: (data.phone as string) ?? "",
    addresses,
    useSameAddressForBilling: Boolean(data.useSameAddressForBilling),
    updatedAt: data.updatedAt && typeof (data.updatedAt as any).toDate === "function"
      ? (data.updatedAt as { toDate: () => Date }).toDate()
      : new Date(),
  };
}

function profileToFirestore(p: Partial<UserProfile>): Record<string, unknown> {
  const out: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
  };
  if (p.firstName !== undefined) out.firstName = p.firstName;
  if (p.lastName !== undefined) out.lastName = p.lastName;
  if (p.email !== undefined) out.email = p.email;
  if (p.phone !== undefined) out.phone = p.phone;
  if (p.useSameAddressForBilling !== undefined) out.useSameAddressForBilling = p.useSameAddressForBilling;
  if (p.addresses !== undefined) {
    out.addresses = p.addresses.map((a) => ({
      id: a.id,
      type: a.type,
      street: a.street,
      ...(a.street2 != null && a.street2 !== "" && { street2: a.street2 }),
      postalCode: a.postalCode,
      city: a.city,
      ...(a.region != null && a.region !== "" && { region: a.region }),
      country: (a.country ?? "ES").toString().toUpperCase().slice(0, 2),
      isDefault: a.isDefault,
    }));
  }
  return out;
}

/** Obtiene el perfil de un usuario por uid. */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, COLLECTION, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return firestoreToProfile(snap.data() as Record<string, unknown>);
}

/** Crea o actualiza el perfil (merge). */
export async function setUserProfile(
  uid: string,
  profile: Partial<UserProfile>
): Promise<void> {
  const ref = doc(db, COLLECTION, uid);
  const current = await getUserProfile(uid);
  const merged: Partial<UserProfile> = {
    firstName: current?.firstName ?? "",
    lastName: current?.lastName ?? "",
    email: current?.email ?? "",
    phone: current?.phone ?? "",
    addresses: current?.addresses ?? [],
    useSameAddressForBilling: current?.useSameAddressForBilling ?? true,
    ...profile,
  };
  await setDoc(ref, profileToFirestore(merged), { merge: true });
}
