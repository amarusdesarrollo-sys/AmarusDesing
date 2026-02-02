import { NextResponse } from "next/server";
import { getAllCategories, createCategory } from "@/lib/firebase/categories";

// Categorías iniciales que se crearán si no existen
const INITIAL_CATEGORIES = [
  {
    name: "Joyería Artesanal",
    slug: "joyeria-artesanal",
    description:
      "Piezas únicas hechas a mano con los mejores materiales naturales",
    order: 1,
    active: true,
  },
  {
    name: "Minerales del Mundo",
    slug: "minerales-del-mundo",
    description: "Minerales y cristales únicos de diferentes partes del mundo",
    order: 2,
    active: true,
  },
  {
    name: "Macramé",
    slug: "macrame",
    description:
      "Arte textil hecho a mano con nudos únicos y diseños originales",
    order: 3,
    active: true,
  },
  {
    name: "Tesoros del Mundo",
    slug: "tesoros-del-mundo",
    description:
      "Piezas únicas y auténticas de diferentes culturas alrededor del mundo",
    order: 4,
    active: true,
  },
  {
    name: "Ropa Artesanal",
    slug: "ropa-artesanal",
    description:
      "Prendas hechas a mano con materiales naturales y técnicas tradicionales",
    order: 5,
    active: true,
  },
  {
    name: "Colección Etiopía",
    slug: "coleccion-etiopia",
    description:
      "Piezas únicas de la cultura etíope, elaboradas con técnicas ancestrales",
    order: 6,
    active: true,
  },
];

export async function POST() {
  try {
    // Verificar si ya existen categorías
    const existingCategories = await getAllCategories();

    if (existingCategories.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Ya existen ${existingCategories.length} categorías. No se crearon nuevas.`,
          existingCount: existingCategories.length,
        },
        { status: 200 }
      );
    }

    // Crear todas las categorías iniciales
    const createdCategories = [];
    for (const categoryData of INITIAL_CATEGORIES) {
      try {
        const category = await createCategory(categoryData);
        createdCategories.push(category);
      } catch (error) {
        console.error(`Error creando categoría ${categoryData.name}:`, error);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Se crearon ${createdCategories.length} categorías exitosamente.`,
        created: createdCategories.length,
        categories: createdCategories,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error inicializando categorías:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error al inicializar categorías",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
