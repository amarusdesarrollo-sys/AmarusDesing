import AnimatedSection from "@/components/AnimatedSection";
import OptimizedImage from "@/components/OptimizedImage";
import { getCloudinaryUrl } from "@/lib/cloudinary";
import type { TeamMember, EquipoCierreContent } from "@/types";

interface EquipoFromCmsProps {
  members: TeamMember[];
  cierre: EquipoCierreContent;
}

export default function EquipoFromCms({ members, cierre }: EquipoFromCmsProps) {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-[#F5EFFF] to-[#E5D9F2] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection delay={0.2}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-4">
              NUESTRO EQUIPO
            </h1>
          </AnimatedSection>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-24">
          {members
            .filter((m) => m.active)
            .map((m, idx) => {
              const imgSrc = m.imagePublicId
                ? getCloudinaryUrl(m.imagePublicId, { width: 600, height: 600 })
                : m.imageUrl;
              const paragraphs = m.bio
                .split("\n\n")
                .map((p) => p.trim())
                .filter(Boolean);
              const isReverse = idx % 2 === 1;
              return (
                <AnimatedSection key={m.id} delay={0.2 + idx * 0.1}>
                  <div
                    className={`flex flex-col md:flex-row items-center gap-8 md:gap-12 ${
                      isReverse ? "md:flex-row-reverse" : ""
                    }`}
                  >
                    <div className="w-full md:w-1/2">
                      <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg bg-gray-200">
                        {imgSrc ? (
                          <OptimizedImage
                            src={imgSrc}
                            alt={m.name}
                            width={600}
                            height={600}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            Imagen no disponible
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-full md:w-1/2">
                      <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                        {m.name}
                      </h2>
                      <div className="text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed space-y-4">
                        {paragraphs.map((p, i) => (
                          <p key={i}>{p}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
        </div>
      </section>

      <section className="bg-gradient-to-br from-[#F5EFFF] to-[#E5D9F2] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <AnimatedSection delay={0.3}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">
              {cierre.title}
            </h2>
            <div className="text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed space-y-4">
              {cierre.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
