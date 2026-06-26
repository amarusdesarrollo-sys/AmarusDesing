import { revalidatePath } from "next/cache";

/** Invalida páginas estáticas que listan productos tras cambios en el catálogo. */
export function revalidateProductCatalog() {
  revalidatePath("/");
  revalidatePath("/tienda-online");
  revalidatePath("/buscar");
  revalidatePath("/categorias", "layout");
  revalidatePath("/productos", "layout");
}
