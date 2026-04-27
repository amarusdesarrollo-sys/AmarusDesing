import AnimatedSection from "@/components/AnimatedSection";
import AnimatedGrid from "@/components/AnimatedGrid";
import AnimatedCategory from "@/components/AnimatedCategory";
import { getActiveCategories } from "@/lib/firebase/categories";
export const revalidate = 300;

export default async function TiendaOnlinePage() {
  const activeCategories = await getActiveCategories().catch(() => []);
  const categories = activeCategories.filter((c) => !c.parentId);

  return (
    <>
      {/* Hero Section - Tienda Online */}
      <section className="bg-gradient-to-br from-[#F5EFFF] to-[#E5D9F2] py-20 md:py-28 lg:py-32 min-h-[85vh] flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AnimatedSection delay={0.2}>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
                TIENDA ONLINE
              </h1>
            </AnimatedSection>

            {/* Grid de categorías */}
            {categories.length > 0 ? (
              <AnimatedGrid
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
                staggerDelay={0.1}
              >
                {categories.map((category, index) => (
                  <AnimatedCategory
                    key={category.id}
                    href={`/categorias/${category.slug}`}
                    src=""
                    publicId={category.image || undefined}
                    imageUrl={category.imageUrl || undefined}
                    alt={category.name}
                    title={category.name}
                    priority={index < 4}
                  />
                ))}
              </AnimatedGrid>
            ) : (
              <div className="text-gray-600 py-20">
                <p>No hay categorías disponibles en este momento.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

