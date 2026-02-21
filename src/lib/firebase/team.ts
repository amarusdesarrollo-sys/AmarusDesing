import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { TeamMember } from "@/types";

const COLLECTION_NAME = "teamMembers";

const convertTimestamp = (ts: unknown): Date => {
  if (ts && typeof ts === "object" && "toDate" in ts) {
    return (ts as { toDate: () => Date }).toDate();
  }
  if (ts instanceof Date) return ts;
  if (typeof ts === "string") return new Date(ts);
  return new Date();
};

function firestoreToTeamMember(data: any, id: string): TeamMember {
  return {
    id,
    name: data.name ?? "",
    imagePublicId: data.imagePublicId,
    imageUrl: data.imageUrl,
    bio: data.bio ?? "",
    order: data.order ?? 0,
    active: data.active ?? true,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  };
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const ref = collection(db, COLLECTION_NAME);
  const q = query(ref, orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => firestoreToTeamMember(d.data(), d.id));
}

export async function getTeamMember(id: string): Promise<TeamMember | null> {
  const ref = doc(db, COLLECTION_NAME, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return firestoreToTeamMember(snap.data(), snap.id);
}

export async function createTeamMember(input: {
  name: string;
  imagePublicId?: string;
  imageUrl?: string;
  bio: string;
  order: number;
  active?: boolean;
}): Promise<string> {
  const ref = collection(db, COLLECTION_NAME);
  const now = Timestamp.now();
  const docRef = await addDoc(ref, {
    name: input.name,
    imagePublicId: input.imagePublicId ?? null,
    imageUrl: input.imageUrl ?? null,
    bio: input.bio,
    order: input.order,
    active: input.active ?? true,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateTeamMember(
  id: string,
  input: Partial<{
    name: string;
    imagePublicId: string | null;
    imageUrl: string | null;
    bio: string;
    order: number;
    active: boolean;
  }>
): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, id);
  const updates: Record<string, unknown> = {
    ...input,
    updatedAt: Timestamp.now(),
  };
  await updateDoc(ref, updates as any);
}

export async function deleteTeamMember(id: string): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, id);
  await deleteDoc(ref);
}
