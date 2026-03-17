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
  runTransaction,
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
    attributes:
      data.attributes && typeof data.attributes === "object"
        ? data.attributes
        : undefined,
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

// Convertir Product a formato Firestore (sin undefined, Firestore no los acepta)
const productToFirestore = (
  product: Omit<Product, "id" | "createdAt" | "updatedAt">
) => {
  const firestoreData: Record<string, unknown> = {
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  Object.keys(product).forEach((key) => {
    const value = (product as Record<string, unknown>)[key];
    if (value !== undefined) {
      firestoreData[key] = value;
    }
  });
  return firestoreData;
};

// Obtener todos los productos
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const productsRef = collection(db, COLLECTION_NAME);
    const q = query(productsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => firestoreToProduct(doc.data(), doc.id));
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

    return snapshot.docs.map((doc) => firestoreToProduct(doc.data(), doc.id));
  } catch (error: any) {
    // Detectar si el error es por falta de índice
    const isIndexError =
      error?.code === "failed-precondition" ||
      error?.code === 9 || // Código numérico de failed-precondition
      (error?.message &&
        (error.message.toLowerCase().includes("index") ||
          error.message.toLowerCase().includes("requires an index")));

    if (isIndexError) {
      // Extraer enlace del error si existe
      const indexLink = error?.message?.match(/https:\/\/[^\s]+/)?.[0];

      console.warn(
        "⚠️ Índice de Firestore no encontrado para productos. Usando fallback temporal..."
      );
      if (indexLink) {
        console.info("📋 Para crear el índice automáticamente, visita:");
        console.info(indexLink);
      } else {
        console.info("📋 Ve a Firebase Console > Firestore > Indexes");
        console.info(
          "📝 Crea un índice para: Collection: products, Fields: category (Asc), createdAt (Desc)"
        );
      }

      // Fallback: obtener todas y filtrar en memoria (menos eficiente pero funciona)
      try {
        const allProducts = await getAllProducts();
        const categoryProducts = allProducts
          .filter((product) => product.category === category)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        console.info(
          `✅ Fallback exitoso: ${categoryProducts.length} productos encontrados en categoría "${category}"`
        );
        return categoryProducts;
      } catch (fallbackError) {
        console.error("❌ Error en fallback:", fallbackError);
        // Si el fallback también falla, retornar array vacío
        return [];
      }
    }

    // Si no es un error de índice, lanzar el error normalmente
    console.error("Error getting products by category:", error);
    throw error;
  }
};

// Obtener productos destacados
export const getFeaturedProducts = async (
  limit?: number
): Promise<Product[]> => {
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

    return snapshot.docs.map((doc) => firestoreToProduct(doc.data(), doc.id));
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

// Actualizar producto (solo admin) - sin enviar undefined a Firestore
export const updateProduct = async (
  id: string,
  updates: Partial<Omit<Product, "id" | "createdAt">>
): Promise<void> => {
  try {
    const productRef = doc(db, COLLECTION_NAME, id);
    const firestoreData: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };
    Object.keys(updates).forEach((key) => {
      const value = (updates as Record<string, unknown>)[key];
      if (value !== undefined) {
        firestoreData[key] = value;
      }
    });
    await updateDoc(productRef, firestoreData);
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

/** Desactivar producto (soft delete) - deja de mostrarse en la tienda */
export const deactivateProduct = async (id: string): Promise<void> => {
  const productRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(productRef, {
    inStock: false,
    updatedAt: Timestamp.now(),
  });
};

/** Reactivar producto - vuelve a mostrarse en la tienda */
export const activateProduct = async (id: string): Promise<void> => {
  const productRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(productRef, {
    inStock: true,
    updatedAt: Timestamp.now(),
  });
};

/** Eliminar producto permanentemente de Firestore. No se puede deshacer. */
export const deleteProductPermanently = async (id: string): Promise<void> => {
  const productRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(productRef);
};

/** @deprecated Use deactivateProduct para desactivar. Se mantiene por compatibilidad. */
export const deleteProduct = deactivateProduct;

/** Valida que haya stock suficiente para los ítems. Devuelve valid y lista de ítems sin stock. */
export const validateOrderStock = async (
  items: { productId: string; quantity: number }[]
): Promise<{
  valid: boolean;
  invalidItems?: Array<{
    productId: string;
    name: string;
    requested: number;
    available: number;
  }>;
}> => {
  const invalidItems: Array<{
    productId: string;
    name: string;
    requested: number;
    available: number;
  }> = [];
  for (const item of items) {
    const product = await getProductById(item.productId);
    if (!product) {
      invalidItems.push({
        productId: item.productId,
        name: "Producto no encontrado",
        requested: item.quantity,
        available: 0,
      });
      continue;
    }
    const available = product.stock ?? 0;
    if (available < item.quantity) {
      invalidItems.push({
        productId: item.productId,
        name: product.name,
        requested: item.quantity,
        available,
      });
    }
  }
  return {
    valid: invalidItems.length === 0,
    invalidItems: invalidItems.length > 0 ? invalidItems : undefined,
  };
};

/** Descuenta stock al confirmar pago. Usado desde webhook de Stripe. */
export const decrementStock = async (
  productId: string,
  quantity: number
): Promise<void> => {
  await runTransaction(db, async (transaction) => {
    const productRef = doc(db, COLLECTION_NAME, productId);
    const snap = await transaction.get(productRef);
    if (!snap.exists()) {
      throw new Error(`Producto ${productId} no encontrado`);
    }
    const data = snap.data();
    const currentStock = (data?.stock ?? 0) as number;
    const newStock = Math.max(0, currentStock - quantity);
    transaction.update(productRef, {
      stock: newStock,
      inStock: newStock > 0,
      updatedAt: Timestamp.now(),
    });
  });
};
