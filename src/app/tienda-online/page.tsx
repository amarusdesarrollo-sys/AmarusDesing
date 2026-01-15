"use client";

import AnimatedSection from "@/components/AnimatedSection";
import AnimatedGrid from "@/components/AnimatedGrid";
import AnimatedCategory from "@/components/AnimatedCategory";

export default function TiendaOnlinePage() {
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
            <AnimatedGrid
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
              staggerDelay={0.1}
            >
              <AnimatedCategory
                href="/joyeria-artesanal"
                src="/images/gallery/colgantes.avif"
                alt="Colgantes artesanal"
                title="Colgantes"
                priority={true}
              />

              <AnimatedCategory
                href="/minerales-del-mundo"
                src="/images/gallery/lotes.avif"
                alt="Lotes de minerales"
                title="Lotes"
                priority={true}
              />

              <AnimatedCategory
                href="/macrame"
                src="/images/gallery/macrame.avif"
                alt="Macramé hecho a mano"
                title="Macramé"
                priority={true}
              />

              <AnimatedCategory
                href="/joyeria-artesanal"
                src="/images/gallery/cabujones.avif"
                alt="Cabujones artesanal"
                title="Cabujones"
                priority={true}
              />

              <AnimatedCategory
                href="/minerales-del-mundo"
                src="/images/gallery/cuarzos maestros.avif"
                alt="Cuarzos maestros"
                title="Cuarzos Maestros"
              />

              <AnimatedCategory
                href="/ropa-artesanal"
                src="/images/gallery/ropa artesanal.avif"
                alt="Ropa artesanal"
                title="Ropa Artesanal"
              />

              <AnimatedCategory
                href="/coleccion-etiopia"
                src="/images/gallery/coleccion etipopia.avif"
                alt="Colección Etiopía"
                title="Colección ETIOPÍA"
              />

              <AnimatedCategory
                href="/joyeria-artesanal"
                src="/images/gallery/anillos.avif"
                alt="Anillos artesanal"
                title="Anillos"
              />
            </AnimatedGrid>
          </div>
        </div>
      </section>
    </>
  );
}

