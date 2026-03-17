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
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { BlogPost } from "@/types";

const COLLECTION = "blogPosts";

const toDate = (v: unknown): Date => {
  if (v && typeof v === "object" && "toDate" in v) return (v as { toDate: () => Date }).toDate();
  if (v instanceof Date) return v;
  if (typeof v === "string") return new Date(v);
  return new Date();
};

function toBlogPost(data: Record<string, unknown>, id: string): BlogPost {
  return {
    id,
    title: (data.title as string) ?? "",
    slug: (data.slug as string) ?? "",
    content: (data.content as string) ?? "",
    excerpt: (data.excerpt as string) ?? "",
    imagePublicId: data.imagePublicId as string | undefined,
    imageUrl: data.imageUrl as string | undefined,
    author: (data.author as string) ?? "",
    publishedAt: toDate(data.publishedAt),
    updatedAt: toDate(data.updatedAt),
    published: Boolean(data.published),
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
  };
}

/** Lista todos los posts publicados (para la web pública) */
export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  const ref = collection(db, COLLECTION);
  const q = query(ref, orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => toBlogPost(d.data() as Record<string, unknown>, d.id))
    .filter((p) => p.published)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

/** Lista todos los posts (admin, incluye borradores) */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const ref = collection(db, COLLECTION);
  const q = query(ref, orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toBlogPost(d.data() as Record<string, unknown>, d.id));
}

/** Obtiene un post por slug (público, solo publicados) */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const ref = collection(db, COLLECTION);
  const q = query(ref, where("slug", "==", slug));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const post = toBlogPost(snap.docs[0].data() as Record<string, unknown>, snap.docs[0].id);
  return post.published ? post : null;
}

/** Obtiene un post por ID (admin) */
export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return toBlogPost(snap.data() as Record<string, unknown>, snap.id);
}

export interface CreateBlogPostInput {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  imagePublicId?: string;
  imageUrl?: string;
  author: string;
  published: boolean;
  tags: string[];
}

/** Crea un nuevo post */
export async function createBlogPost(input: CreateBlogPostInput): Promise<string> {
  const ref = collection(db, COLLECTION);
  const now = Timestamp.now();
  const docRef = await addDoc(ref, {
    ...input,
    publishedAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export interface UpdateBlogPostInput {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  imagePublicId?: string;
  imageUrl?: string;
  author?: string;
  published?: boolean;
  tags?: string[];
}

/** Actualiza un post */
export async function updateBlogPost(id: string, input: UpdateBlogPostInput): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    ...input,
    updatedAt: Timestamp.now(),
    ...(input.published !== undefined && { publishedAt: Timestamp.now() }),
  });
}

/** Elimina un post */
export async function deleteBlogPost(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}
