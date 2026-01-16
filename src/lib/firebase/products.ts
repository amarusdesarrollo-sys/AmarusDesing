import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Product, ProductCategory } from "@/types";

const COLLECTION_NAME = "products";

// Convertir Firestore Timestamp a Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === "string") {
    return new Date(timestamp);
  }
  return new Date();
};

// Convertir producto de Firestore a Product type
const firestoreToProduct = (data: any, id: string): Product => {
  return {
    id,
    name: data.name,
    description: data.description,
    price: data.price,
    originalPrice: data.originalPrice,
    category: data.category as ProductCategory,
    subcategory: data.subcategory,
    images: data.images || [],
    inStock: data.inStock ?? true,
    stock: data.stock ?? 0,
    featured: data.featured ?? false,
    tags: data.tags || [],
    materials: data.materials,
    dimensions: data.dimensions,
    weight: data.weight,
    artisan: data.artisan,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    seo: data.seo || {
      title: data.name,
      description: data.description,
      keywords: [],
    },
  };
};

// Convertir Product a formato Firestore
const productToFirestore = (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
  return {
    ...product,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
};

// Obtener todos los productos
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const productsRef = collection(db, COLLECTION_NAME);
    const q = query(productsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) =>
      firestoreToProduct(doc.data(), doc.id)
    );
  } catch (error) {
    console.error("Error getting products:", error);
    throw error;
  }
};

// Obtener producto por ID
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const productRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(productRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return firestoreToProduct(snapshot.data(), snapshot.id);
  } catch (error) {
    console.error("Error getting product:", error);
    throw error;
  }
};

// Obtener productos por categoría
export const getProductsByCategory = async (
  category: ProductCategory
): Promise<Product[]> => {
  try {
    const productsRef = collection(db, COLLECTION_NAME);
    const q = query(
      productsRef,
      where("category", "==", category),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) =>
      firestoreToProduct(doc.data(), doc.id)
    );
  } catch (error) {
    console.error("Error getting products by category:", error);
    throw error;
  }
};

// Obtener productos destacados
export const getFeaturedProducts = async (limit?: number): Promise<Product[]> => {
  try {
    const productsRef = collection(db, COLLECTION_NAME);
    const q = query(
      productsRef,
      where("featured", "==", true),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    
    let products = snapshot.docs.map((doc) =>
      firestoreToProduct(doc.data(), doc.id)
    );
    
    if (limit) {
      products = products.slice(0, limit);
    }
    
    return products;
  } catch (error) {
    console.error("Error getting featured products:", error);
    throw error;
  }
};

// Obtener productos en stock
export const getInStockProducts = async (): Promise<Product[]> => {
  try {
    const productsRef = collection(db, COLLECTION_NAME);
    const q = query(
      productsRef,
      where("inStock", "==", true),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) =>
      firestoreToProduct(doc.data(), doc.id)
    );
  } catch (error) {
    console.error("Error getting in-stock products:", error);
    throw error;
  }
};

// Crear producto (solo admin)
export const createProduct = async (
  product: Omit<Product, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const productsRef = collection(db, COLLECTION_NAME);
    const firestoreData = productToFirestore(product);
    const docRef = await addDoc(productsRef, firestoreData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
};

// Actualizar producto (solo admin)
export const updateProduct = async (
  id: string,
  updates: Partial<Omit<Product, "id" | "createdAt">>
): Promise<void> => {
  try {
    const productRef = doc(db, COLLECTION_NAME, id);
    const firestoreData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };
    await updateDoc(productRef, firestoreData);
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

// Eliminar producto (solo admin) - Soft delete
export const deleteProduct = async (id: string): Promise<void> => {
  try {
    const productRef = doc(db, COLLECTION_NAME, id);
    // Soft delete: marcar como no disponible en lugar de eliminar
    await updateDoc(productRef, {
      inStock: false,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};
