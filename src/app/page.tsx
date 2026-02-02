import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Users } from "lucide-react";
import { HeroImage } from "@/components/OptimizedImage";
import AnimatedSection from "@/components/AnimatedSection";
import AnimatedButton from "@/components/AnimatedButton";

export default function Home() {
  return (
    <>
      {/* Sección Joyería Artesanal */}
      <section className="hero-section relative overflow-hidden">
        <HeroImage
          src="/images/heroes/seccion joyeria artesanal.avif"
          alt="Joyería artesanal única creada a mano"
          className="hero-image"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

        {/* Contenido centrado */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <AnimatedSection delay={0.2}>
            <h2 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-6 md:mb-12 leading-tight">
              <span className="text-white">JOYERÍA</span>
              <br />
              <span className="text-black">ARTESANAL</span>
            </h2>
          </AnimatedSection>

          <AnimatedSection delay={0.4}>
            <AnimatedButton
              href="/joyeria-artesanal"
              className="px-6 py-3 md:px-8 md:py-4 rounded-lg font-bold text-base md:text-lg"
            >
              DESCUBRIR MÁS
              <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
            </AnimatedButton>
          </AnimatedSection>
        </div>
      </section>

      {/* Sección Minerales del Mundo */}
      <section className="hero-section relative overflow-hidden">
        <HeroImage
          src="/images/heroes/seccion minerales del mundo.avif"
          alt="Minerales únicos de todo el mundo"
          className="hero-image"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

        {/* Contenido centrado */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <AnimatedSection delay={0.2}>
            <h2 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-6 md:mb-12 leading-tight">
              <span className="text-white">MINERALES</span>
              <br />
              <span className="text-black">DEL MUNDO</span>
            </h2>
          </AnimatedSection>

          <AnimatedSection delay={0.4}>
            <AnimatedButton
              href="/minerales-del-mundo"
              className="px-6 py-3 md:px-8 md:py-4 rounded-lg font-bold text-base md:text-lg"
            >
              DESCUBRIR MÁS
              <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
            </AnimatedButton>
          </AnimatedSection>
        </div>
      </section>

      {/* Sección Macramé */}
      <section className="hero-section relative overflow-hidden">
        <HeroImage
          src="/images/heroes/seccion macrame.avif"
          alt="Macramé hecho a mano con técnicas tradicionales"
          className="hero-image"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

        {/* Contenido centrado */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <AnimatedSection delay={0.2}>
            <h2 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-6 md:mb-12 leading-tight">
              <span className="text-white">MACRAMÉ</span>
            </h2>
          </AnimatedSection>

          <AnimatedSection delay={0.4}>
            <AnimatedButton
              href="/macrame"
              className="px-6 py-3 md:px-8 md:py-4 rounded-lg font-bold text-base md:text-lg"
            >
              DESCUBRIR MÁS
              <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
            </AnimatedButton>
          </AnimatedSection>
        </div>
      </section>

      {/* Sección Hand Made Clothing */}
      <section className="hero-section relative overflow-hidden">
        <HeroImage
          src="/images/heroes/seccion han made cloting.avif"
          alt="Ropa artesanal que combina tradición y estilo contemporáneo"
          className="hero-image"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

        {/* Contenido centrado */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <AnimatedSection delay={0.2}>
            <h2 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-6 md:mb-12 leading-tight">
              <span className="text-white">HAND MADE</span>
              <br />
              <span className="text-black">CLOTHING</span>
            </h2>
          </AnimatedSection>

          <AnimatedSection delay={0.4}>
            <AnimatedButton
              href="/ropa-artesanal"
              className="px-6 py-3 md:px-8 md:py-4 rounded-lg font-bold text-base md:text-lg"
            >
              DESCUBRIR MÁS
              <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
            </AnimatedButton>
          </AnimatedSection>
        </div>
      </section>

      {/* Sección Conoce nuestro proyecto familiar */}
      <section className="flex flex-col lg:flex-row min-h-[90vh]">
        {/* Columna izquierda - Imagen con gradiente hacia la derecha */}
        <div className="w-full lg:w-1/2 relative bg-gray-200 overflow-hidden min-h-[400px] lg:min-h-[90vh]">
          <div className="relative w-full h-full">
            <Image
              src="/images/heroes/seccion corazon conoce nuestro proyecto.avif"
              alt="Conoce nuestro proyecto familiar"
              width={1200}
              height={1600}
              className="w-full h-full object-cover"
              priority={true}
              sizes="(max-width: 1024px) 100vw, 50vw"
              quality={90}
            />
            {/* Gradiente de transición hacia el fondo lila - muy intenso */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#e5d9f2]/60 to-[#e5d9f2] pointer-events-none"></div>
          </div>
        </div>

        {/* Columna derecha - Contenido con fondo lila y gradiente desde la imagen */}
        <div className="w-full lg:w-1/2 bg-gradient-to-r from-[#e5d9f2]/90 lg:from-[#e5d9f2] to-[#e5d9f2] flex flex-col justify-center items-center px-8 lg:px-12 py-12 lg:py-8 min-h-[400px] lg:min-h-[90vh]">
          <div className="max-w-lg text-center w-full my-auto">
            <AnimatedSection delay={0.2}>
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 lg:mb-6 leading-tight">
                <span className="text-white">CONOCE</span>
                <br />
                <span className="text-white">NUESTRO</span>
                <br />
                <span className="text-black">PROYECTO</span>
                <br />
                <span className="text-black">FAMILIAR</span>
              </h2>
            </AnimatedSection>

            <AnimatedSection delay={0.4}>
              <div className="text-gray-700 mb-6 lg:mb-8 text-base md:text-lg lg:text-xl leading-relaxed text-center space-y-3">
                <p>
                  Con mucha ilusión presentamos nuestro proyecto, que representa
                  nuestra filosofía de vida
                </p>

                <p className="italic font-medium text-lg md:text-xl lg:text-2xl">
                  "La felicidad solo es real si es compartida"
                </p>

                <p>
                  Por ello y muchas razones más incluimos a más artesan@s amig@s
                  en AmarusDesign
                </p>

                <p>
                  Ofreciéndote así más variedad, conociendo siempre el origen de
                  tu joya, ropa o accesorio
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.6}>
              <div className="flex justify-center">
                <AnimatedButton
                  href="/equipo"
                  className="px-6 lg:px-8 py-3 lg:py-4 rounded-lg font-bold text-base lg:text-lg"
                >
                  CONOCE AL EQUIPO
                  <Users className="ml-2 h-4 w-4 lg:h-5 lg:w-5" />
                </AnimatedButton>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Sección AMARUSDESIGN - Historia */}
      <section id="historia" className="relative scroll-mt-20">
        {/* Imagen con altura ajustada para verse completa */}
        <div className="relative w-full bg-gray-200">
          <div className="relative w-full">
            <Image
              src="/images/heroes/seccion como llegamos aqui.avif"
              alt="¿Cómo llegamos aquí? - Historia de AmarusDesign"
              width={1920}
              height={1080}
              className="w-full h-auto object-contain"
              priority={true}
              sizes="100vw"
              quality={90}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none"></div>

            {/* Título posicionado a la derecha y abajo */}
            <div className="absolute top-12 right-1 md:top-32 md:right-12 px-4 z-10">
              <AnimatedSection delay={0.3} direction="right">
                <h2 className="text-xl md:text-5xl font-light leading-tight tracking-wider">
                  <span className="text-white">AMARUSDESIGN</span>
                </h2>
              </AnimatedSection>
            </div>
          </div>
        </div>

        {/* Texto de la historia */}
        <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <AnimatedSection delay={0.2}>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 text-center">
                ¿Cómo llegamos aquí?
              </h3>
            </AnimatedSection>

            <AnimatedSection delay={0.4}>
              <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-6 text-base md:text-lg lg:text-xl">
                <p>
                  Nos conocimos viajando hace ya unos años, hoy en día, aparte
                  de ser los creadores de AmarusDesign, somos mama y papa de
                  Amaru. Que como el nombre ya indica es la razón por la que
                  hemos creado esta empresa.
                </p>

                <p>
                  Amaru lleva un nombre Aimara porque nos conocimos a orillas
                  del Lago Titicaca.
                </p>

                <p>
                  Durante años seguimos en la ruta, vendiendo nuestras
                  artesanías, en ocasiones ya siendo una familia. Por diferentes
                  razones volvimos a Europa para trabajar de forma convencional,
                  siempre con la ilusión de volver a nuestro lado más creativo.
                </p>

                <p>
                  El tiempo ha pasado y casi sin planearlo, hemos vuelto a
                  nuestra esencia creando este proyecto.
                </p>

                <p>
                  Un sueño para resolver un sustento económico, pero a la vez
                  armoniosa con la familia, que nos permita disfrutar de la
                  crianza de nuestro hijo e incluso integrarlo en nuestro día a
                  día.
                </p>

                <p>
                  Invertimos nuestra energía y cariño, en atender a nuestros
                  clientes cómo se merecen, siempre sin perder el amor al
                  detalle. Buscamos reinventarnos cada día, incluyendo en
                  nuestro equipo a más artesanos que comparten nuestra pasión
                  por los minerales.
                </p>

                <p className="text-2xl font-bold text-center text-gray-800 mt-8">
                  AmarusDesign
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Formulario de suscripción */}
      <section className="bg-[#e5d9f2] min-h-[60vh] flex flex-col items-center justify-center py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 w-full flex flex-col items-center pt-12 pb-12 md:pt-16 md:pb-16">
          <div className="text-center space-y-10 md:space-y-14 w-full flex flex-col items-center">
            <AnimatedSection delay={0.2}>
              <h3 className="text-2xl md:text-4xl font-bold text-gray-900">
                Formulario de suscripción
              </h3>
            </AnimatedSection>
            <AnimatedSection delay={0.4}>
              <p className="text-gray-700 max-w-2xl mx-auto text-base md:text-lg lg:text-xl">
                Mantente al día con nuestras últimas ofertas especiales
              </p>
            </AnimatedSection>
            <AnimatedSection delay={0.6}>
              <form className="max-w-lg mx-auto space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="nombre"
                    placeholder="Nombre"
                    required
                    className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7b6bc7] text-base md:text-lg"
                  />
                  <input
                    type="text"
                    name="apellido"
                    placeholder="Apellido"
                    className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7b6bc7] text-base md:text-lg"
                  />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Tu email"
                  required
                  className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7b6bc7] text-base md:text-lg"
                />
                <button
                  type="submit"
                  className="w-full bg-[#6b5bb6] text-white px-8 py-4 rounded-lg hover:bg-[#5b4ba5] transition-colors font-medium text-base md:text-lg"
                >
                  Suscribirme
                </button>
              </form>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </>
  );
}
