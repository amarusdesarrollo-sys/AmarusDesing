import Image from "next/image";
import AnimatedSection from "@/components/AnimatedSection";
import { getPoliticasContent } from "@/lib/firebase/content";
import OptimizedImage from "@/components/OptimizedImage";
import { getCloudinaryUrl } from "@/lib/cloudinary";
import Link from "next/link";

export default async function PoliticasPage() {
  const content = await getPoliticasContent().catch(() => null);

  const heroTitle = content?.heroTitle ?? "POLÍTICAS DE LA TIENDA Y ENVÍOS";
  const intro =
    content?.intro ??
    `En AmarusDesign queremos que nuestros clientes reciban el mejor servicio durante su compra para que siempre quieran volver con nosotros. Por eso creemos que las políticas de nuestra tienda deben ser justas, claras y transparentes. A continuación encontrarás una lista con nuestras políticas. Si hay alguna información que no se encuentre en la lista, `;
  const sections =
    content?.sections && content.sections.length > 0
      ? content.sections
      : [
          {
            title: "ENVÍOS Y ENTREGAS",
            content:
              "Cada pieza está empaquetada con amor y listo para ser un gran regalo para cualquier ocasión.\n\nLos envíos se realizan desde España mediante correos certificado, de esta manera usted puede asegurarse de que recibirá su paquete en sus manos y tendrá un reembolso completo si su paquete se extraviase.",
          },
          {
            title: "NUESTRA POLÍTICA DE DEVOLUCIONES",
            content:
              "Aceptamos cambios y devoluciones. Ponte en contacto con nosotros en los 14 días posteriores a la entrega.",
          },
          {
            title: "LA PRIVACIDAD EN AMARUSDESIGN",
            content: "Tus datos están seguros. Respetamos la legislación vigente en protección de datos personales (RGPD, LOPD-GDD).",
          },
        ];

  const heroImageSrc = content?.heroImagePublicId
    ? getCloudinaryUrl(content.heroImagePublicId, { width: 1920, height: 1080 })
    : content?.heroImageUrl ?? "/images/heroes/037.jpg";

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-[#F5EFFF] to-[#E5D9F2] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection delay={0.2}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-4">
              {heroTitle}
            </h1>
          </AnimatedSection>
        </div>
      </section>

      {heroImageSrc && (
        <section className="relative w-full bg-gray-200">
          <div className="relative w-full">
            {content?.heroImagePublicId ? (
              <OptimizedImage
                src={heroImageSrc}
                alt="Políticas de la tienda"
                width={1920}
                height={1080}
                className="w-full h-auto object-contain"
                sizes="100vw"
              />
            ) : (
              <Image
                src={heroImageSrc}
                alt="Políticas de la tienda"
                width={1920}
                height={1080}
                className="w-full h-auto object-contain"
                priority
                sizes="100vw"
                quality={90}
              />
            )}
          </div>
        </section>
      )}

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection delay={0.2}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 text-center">
              Lo que necesitas saber
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed mb-12 text-center">
              {intro}
              <Link
                href="/contacto"
                className="text-[#6B5BB6] hover:text-[#5B4BA5] font-semibold underline"
              >
                contáctanos
              </Link>
              {" "}y te ayudaremos.
            </p>
          </AnimatedSection>

          {sections.map((section, idx) => (
            <AnimatedSection key={idx} delay={0.3 + idx * 0.1}>
              <div className="mb-12">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
                  {section.title}
                </h3>
                <div className="text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed space-y-4 whitespace-pre-line">
                  {section.content.split("\n").map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>
    </div>
  );
}
