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
import type { Category } from "@/types";

const COLLECTION_NAME = "categories";

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

// Convertir documento de Firestore a Category
const firestoreToCategory = (data: any, id: string): Category => {
  return {
    id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    image: data.image,
    icon: data.icon,
    order: data.order ?? 0,
    active: data.active ?? true,
    parentId: data.parentId,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  };
};

// Convertir Category a formato Firestore
const categoryToFirestore = (
  category: Omit<Category, "id" | "createdAt" | "updatedAt">
) => {
  // Filtrar campos undefined (Firestore no los acepta)
  const firestoreData: any = {
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  // Solo agregar campos que no sean undefined
  Object.keys(category).forEach((key) => {
    const value = (category as any)[key];
    if (value !== undefined) {
      firestoreData[key] = value;
    }
  });
  
  return firestoreData;
};

// Obtener todas las categorías
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const categoriesRef = collection(db, COLLECTION_NAME);
    const q = query(categoriesRef, orderBy("order", "asc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => firestoreToCategory(doc.data(), doc.id));
  } catch (error) {
    console.error("Error getting categories:", error);
    throw error;
  }
};

// Obtener solo categorías activas
// NOTA: Esta consulta requiere un índice compuesto en Firestore
// Si ves un error, haz clic en el enlace proporcionado para crear el índice automáticamente
// O crea manualmente: Collection: categories, Fields: active (Asc), order (Asc)
export const getActiveCategories = async (): Promise<Category[]> => {
  try {
    const categoriesRef = collection(db, COLLECTION_NAME);
    const q = query(
      categoriesRef,
      where("active", "==", true),
      orderBy("order", "asc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => firestoreToCategory(doc.data(), doc.id));
  } catch (error: any) {
    // Detectar si el error es por falta de índice
    const isIndexError =
      error?.code === "failed-precondition" ||
      error?.code === 9 || // Código numérico de failed-precondition
      (error?.message && (
        error.message.toLowerCase().includes("index") ||
        error.message.toLowerCase().includes("requires an index")
      ));

    if (isIndexError) {
      // Extraer enlace del error si existe
      const indexLink = error?.message?.match(/https:\/\/[^\s]+/)?.[0];
      
      console.warn("⚠️ Índice de Firestore no encontrado. Usando fallback temporal...");
      if (indexLink) {
        console.info("📋 Para crear el índice automáticamente, visita:");
        console.info(indexLink);
      } else {
        console.info("📋 Ve a Firebase Console > Firestore > Indexes");
        console.info("📝 O revisa docs/CREAR_INDICE_FIRESTORE.md para instrucciones");
      }
      
      // Fallback: obtener todas y filtrar en memoria (menos eficiente pero funciona)
      try {
        const allCategories = await getAllCategories();
        const activeCategories = allCategories
          .filter((cat) => cat.active)
          .sort((a, b) => a.order - b.order);
        console.info(`✅ Fallback exitoso: ${activeCategories.length} categorías activas encontradas`);
        return activeCategories;
      } catch (fallbackError) {
        console.error("❌ Error en fallback:", fallbackError);
        // Si el fallback también falla, retornar array vacío
        return [];
      }
    }
    
    // Si no es un error de índice, lanzar el error normalmente
    console.error("Error getting active categories:", error);
    throw error;
  }
};

// Obtener categoría por slug
export const getCategoryBySlug = async (
  slug: string
): Promise<Category | null> => {
  try {
    const categoriesRef = collection(db, COLLECTION_NAME);
    const q = query(
      categoriesRef,
      where("slug", "==", slug),
      where("active", "==", true)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return firestoreToCategory(doc.data(), doc.id);
  } catch (error) {
    console.error("Error getting category by slug:", error);
    throw error;
  }
};

// Obtener categoría por ID
export const getCategoryById = async (id: string): Promise<Category | null> => {
  try {
    const categoryRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(categoryRef);

    if (!snapshot.exists()) {
      return null;
    }

    return firestoreToCategory(snapshot.data(), snapshot.id);
  } catch (error) {
    console.error("Error getting category by id:", error);
    throw error;
  }
};

// Crear nueva categoría (solo admin)
export const createCategory = async (
  category: Omit<Category, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const categoriesRef = collection(db, COLLECTION_NAME);
    const firestoreData = categoryToFirestore(category);
    
    console.log("💾 Guardando en Firestore:", {
      name: firestoreData.name,
      slug: firestoreData.slug,
      image: firestoreData.image,
      hasImage: !!firestoreData.image,
    });
    
    const docRef = await addDoc(categoriesRef, firestoreData);
    
    console.log("✅ Categoría guardada en Firestore con ID:", docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error("❌ Error creating category:", error);
    throw error;
  }
};

// Actualizar categoría (solo admin)
export const updateCategory = async (
  id: string,
  updates: Partial<Omit<Category, "id" | "createdAt">>
): Promise<void> => {
  try {
    const categoryRef = doc(db, COLLECTION_NAME, id);
    
    // Filtrar campos undefined (Firestore no los acepta)
    const firestoreData: any = {
      updatedAt: Timestamp.now(),
    };
    
    // Solo agregar campos que no sean undefined
    Object.keys(updates).forEach((key) => {
      const value = (updates as any)[key];
      if (value !== undefined) {
        firestoreData[key] = value;
      }
    });
    
    await updateDoc(categoryRef, firestoreData);
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

// Eliminar categoría (solo admin) - Soft delete
export const deleteCategory = async (id: string): Promise<void> => {
  try {
    const categoryRef = doc(db, COLLECTION_NAME, id);
    // Soft delete: marcar como inactiva en lugar de eliminar
    await updateDoc(categoryRef, {
      active: false,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};

// Obtener subcategorías de una categoría padre
export const getSubcategories = async (
  parentId: string
): Promise<Category[]> => {
  try {
    const categoriesRef = collection(db, COLLECTION_NAME);
    const q = query(
      categoriesRef,
      where("parentId", "==", parentId),
      where("active", "==", true),
      orderBy("order", "asc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => firestoreToCategory(doc.data(), doc.id));
  } catch (error) {
    console.error("Error getting subcategories:", error);
    throw error;
  }
};
