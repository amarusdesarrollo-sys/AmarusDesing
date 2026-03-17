import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Coupon, CouponDiscountType, CouponScope } from "@/types";

const COLLECTION = "coupons";

const toDate = (v: unknown): Date => {
  if (v && typeof v === "object" && "toDate" in v) return (v as any).toDate();
  if (v instanceof Date) return v;
  if (typeof v === "string") return new Date(v);
  return new Date();
};

function toCoupon(data: any, id: string): Coupon {
  return {
    id,
    code: (data.code ?? "").toString().toUpperCase(),
    active: Boolean(data.active),
    scope: (data.scope as CouponScope) ?? "category",
    discountType: (data.discountType as CouponDiscountType) ?? "percent",
    value: typeof data.value === "number" ? data.value : 0,
    categorySlugs: Array.isArray(data.categorySlugs) ? data.categorySlugs : undefined,
    productIds: Array.isArray(data.productIds) ? data.productIds : undefined,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function getAllCoupons(): Promise<Coupon[]> {
  const ref = collection(db, COLLECTION);
  const q = query(ref, orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toCoupon(d.data(), d.id));
}

export async function getCouponById(id: string): Promise<Coupon | null> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return toCoupon(snap.data(), snap.id);
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const c = code.trim().toUpperCase();
  if (!c) return null;
  const ref = collection(db, COLLECTION);
  const q = query(ref, where("code", "==", c));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return toCoupon(snap.docs[0].data(), snap.docs[0].id);
}

export async function createCoupon(input: {
  code: string;
  active: boolean;
  scope: CouponScope;
  discountType: CouponDiscountType;
  value: number;
  categorySlugs?: string[];
  productIds?: string[];
}): Promise<string> {
  const now = Timestamp.now();
  const ref = collection(db, COLLECTION);
  const docRef = await addDoc(ref, {
    code: input.code.trim().toUpperCase(),
    active: Boolean(input.active),
    scope: input.scope,
    discountType: input.discountType,
    value: input.value,
    categorySlugs: input.categorySlugs ?? [],
    productIds: input.productIds ?? [],
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateCoupon(
  id: string,
  input: Partial<{
    code: string;
    active: boolean;
    scope: CouponScope;
    discountType: CouponDiscountType;
    value: number;
    categorySlugs: string[];
    productIds: string[];
  }>
): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  const updates: any = { ...input, updatedAt: Timestamp.now() };
  if (updates.code) updates.code = updates.code.trim().toUpperCase();
  await updateDoc(ref, updates);
}

export async function deleteCoupon(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}

