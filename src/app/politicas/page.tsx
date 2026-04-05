import AnimatedSection from "@/components/AnimatedSection";
import { getPoliticasContent } from "@/lib/firebase/content";
import Link from "next/link";
import { FileText, Package, RefreshCw, ShieldCheck } from "lucide-react";

const sectionIcons = [Package, RefreshCw, ShieldCheck, FileText];

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
            content:
              "Tus datos están seguros. Respetamos la legislación vigente en protección de datos personales (RGPD, LOPD-GDD).",
          },
        ];

  const pagePadX = "px-5 sm:px-6 md:px-8 lg:px-10";

  return (
    <div className="min-h-screen bg-[#f8f7fc]">
      <section
        className={`relative bg-gradient-to-br from-[#F5EFFF] via-[#EDE7F8] to-[#E0D4F0] ${pagePadX} py-10 md:py-12`}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          aria-hidden
          style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, rgba(107, 91, 182, 0.12) 0%, transparent 45%),
              radial-gradient(circle at 80% 60%, rgba(107, 91, 182, 0.1) 0%, transparent 40%)`,
          }}
        />
        <div className="relative max-w-lg mx-auto text-center px-1">
          <AnimatedSection delay={0.1}>
            <p className="text-[10px] sm:text-xs font-semibold tracking-[0.18em] text-[#6B5BB6] uppercase mb-2.5">
              Información para clientes
            </p>
            <h1 className="text-xl sm:text-2xl md:text-[1.65rem] font-bold text-gray-900 leading-snug mb-3">
              {heroTitle}
            </h1>
            <p className="text-sm md:text-[0.95rem] text-gray-600 leading-relaxed max-w-md mx-auto">
              Condiciones claras de envíos, devoluciones y privacidad. Todo en un solo lugar.
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className={`${pagePadX} pt-8 md:pt-10 pb-0`}>
        <div className="max-w-3xl mx-auto w-full">
          <AnimatedSection delay={0.15}>
            <div className="rounded-2xl bg-white border border-gray-200/80 shadow-sm p-6 sm:p-8 md:p-10 mb-8 md:mb-10">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 rounded-xl bg-[#F5EFFF] p-3 text-[#6B5BB6]">
                  <FileText className="h-6 w-6" aria-hidden />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                    Lo que necesitas saber
                  </h2>
                  <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                    {intro}
                    <Link
                      href="/contacto"
                      className="text-[#6B5BB6] hover:text-[#5B4BA5] font-semibold underline underline-offset-2 decoration-[#6B5BB6]/40 hover:decoration-[#5B4BA5]"
                    >
                      contáctanos
                    </Link>{" "}
                    y te ayudaremos.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>

          <div className="flex flex-col gap-5 md:gap-6">
            {sections.map((section, idx) => {
              const Icon = sectionIcons[idx % sectionIcons.length];
              return (
                <AnimatedSection key={idx} delay={0.2 + idx * 0.06}>
                  <article className="group rounded-2xl bg-white border border-gray-200/80 shadow-sm p-6 sm:p-8 md:p-9 transition-shadow hover:shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                      <div className="flex-shrink-0 inline-flex rounded-xl bg-gradient-to-br from-[#F5EFFF] to-[#EDE7F8] p-3.5 text-[#6B5BB6] ring-1 ring-[#6B5BB6]/10">
                        <Icon className="h-6 w-6" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 tracking-tight">
                          {section.title}
                        </h3>
                        <div className="text-gray-600 leading-relaxed text-base md:text-[1.05rem] space-y-3">
                          {section.content.split("\n").map((p, i) =>
                            p.trim() ? (
                              <p key={i} className="first:mt-0">
                                {p}
                              </p>
                            ) : null
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                </AnimatedSection>
              );
            })}
          </div>

          <AnimatedSection delay={0.35 + sections.length * 0.06}>
            <p className="mt-8 md:mt-10 text-center text-sm text-gray-500">
              ¿Dudas sobre tu pedido?{" "}
              <Link
                href="/contacto"
                className="font-semibold text-[#6B5BB6] hover:text-[#5B4BA5] underline underline-offset-2"
              >
                Escribinos
              </Link>
            </p>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
