import Image from "next/image";
import AnimatedSection from "@/components/AnimatedSection";

export default function EquipoPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#F5EFFF] to-[#E5D9F2] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection delay={0.2}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-4">
              NUESTRO EQUIPO
            </h1>
          </AnimatedSection>
        </div>
      </section>

      {/* Equipo Members */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-24">
          {/* Meli */}
          <AnimatedSection delay={0.2}>
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="w-full md:w-1/2">
                <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src="/images/equipo/melina.JPG"
                    alt="Meli"
                    width={600}
                    height={600}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                  Meli
                </h2>
                <div className="text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed space-y-4">
                  <p>
                    Conocimos a Meli desde la distancia, se ha convertido en un
                    persona muy importante de este proyecto. Además de realizar
                    parte de nuestra colección en macramé, nos ayuda en la
                    organización.
                  </p>
                  <p>
                    Me encantan las artesanías desde chica, por ello aprendí de
                    forma autodidacta en un viaje a Brasil en 2018. Combino
                    actualmente mi pasión por los hilos con los estudios.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Tincho */}
          <AnimatedSection delay={0.3}>
            <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-12">
              <div className="w-full md:w-1/2">
                <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src="/images/equipo/tincho.jpg"
                    alt="Tincho"
                    width={600}
                    height={600}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                  Tincho
                </h2>
                <div className="text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed space-y-4">
                  <p>
                    Vivo haciendo artesanía desde mi adolescencia, no me imagino
                    otra forma de vida. Trabajo diferentes técnicas con metal y
                    macramé, teniendo presente la tradición artesanal
                    Latinoamericana.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Franco */}
          <AnimatedSection delay={0.4}>
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="w-full md:w-1/2">
                <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src="/images/equipo/PHOTO-2023-02-06-22-46-41.jpg"
                    alt="Franco"
                    width={600}
                    height={600}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                  Franco
                </h2>
                <div className="text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed space-y-4">
                  <p>
                    Afortunados de contar con Franco, como apoyo para la
                    creación de nuestras colecciones con técnica en soldadura.
                    Trabaja con precisión y acabados de calidad.
                  </p>
                  <p>
                    Hago joyería en el taller que tengo en mi casa junto a mi
                    familia.
                  </p>
                  <p>
                    Mi gran sueño es seguir especializándome cada vez más en
                    este rubro, asistiendo a reconocidas escuelas de orfebrería
                    en Argentina.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Chiara */}
          <AnimatedSection delay={0.5}>
            <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-12">
              <div className="w-full md:w-1/2">
                <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src="/images/equipo/PHOTO-2023-02-06-21-42-47_edited.jpg"
                    alt="Chiara"
                    width={600}
                    height={600}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                  Chiara
                </h2>
                <div className="text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed space-y-4">
                  <p>
                    Nuestra querida fotógrafa, es todo un honor contar con ella
                    como profesional y amiga.
                  </p>
                  <p>
                    Gracias a ella, l@s modelos muestran su belleza natural
                    llevando nuestras joyas.
                  </p>
                  <p className="text-[#6B5BB6] font-semibold">
                    @chiara_fotografia_grancanaria
                  </p>
                  <p>
                    Al principio he aprendido por mi cuenta, pero con el tiempo
                    empecé a asistir a diferentes cursos. Me encanta poder
                    expresar emociones a través de mis fotografías.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Mati */}
          <AnimatedSection delay={0.6}>
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="w-full md:w-1/2">
                <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src="/images/equipo/Captura de pantalla 2021-06-17 a las 19.21_edited.jpg"
                    alt="Mati"
                    width={600}
                    height={600}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                  Mati
                </h2>
                <div className="text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed space-y-4">
                  <p>
                    Tenemos mucha suerte al contar con Mati, gran amigo y
                    profesional del macramé.
                  </p>
                  <p>
                    Amante de las piedras y artesano de corazón, hace ya muchos
                    años, destaca por un estilo único y detallista.
                  </p>
                  <p>
                    Mi rubro es el tejido. A la edad de 19 años me enseñaron los
                    puntos básicos, es mi sustento desde entonces. Soy artesano
                    porque es el ambiente donde me siento más a gusto.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Uschi */}
          <AnimatedSection delay={0.7}>
            <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-12">
              <div className="w-full md:w-1/2">
                <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src="/images/equipo/4a0d465e-a481-4a03-bf34-1ee1f69ba33f.JPG"
                    alt="Uschi"
                    width={600}
                    height={600}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                  Uschi
                </h2>
                <div className="text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed space-y-4">
                  <p>
                    Les presento con mucho orgullo a mi mama, recuerdo con cariño
                    sus abrigos de mi infancia.
                  </p>
                  <p>
                    Siempre le ha gustado la moda, por que no crear un poco de
                    moda hecha a mano.
                  </p>
                  <p>
                    Siempre me gustó la moda y el diseño, era mi gran sueño.
                    Finalmente estudié otra cosa totalmente diferente, pero sigo
                    disfrutando de mi parte más creativa a diario. Ya sea
                    haciendo ropa, restaurando muebles...
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Miembro adicional - Amigo de la familia */}
          <AnimatedSection delay={0.8}>
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="w-full md:w-1/2">
                <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg bg-gray-200 flex items-center justify-center">
                  <p className="text-gray-400 text-center px-4">
                    Imagen no disponible
                  </p>
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                  Amigo de la familia
                </h2>
                <div className="text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed space-y-4">
                  <p>
                    Amigo de la familia, con más de dos décadas de experiencia
                    en la artesanía y venta callejera. Viajero, padre y hermano
                    de la vida. Muy agradecidos por contar con este compañero,
                    en nuestro proyecto familiar.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Sección final */}
      <section className="bg-gradient-to-br from-[#F5EFFF] to-[#E5D9F2] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <AnimatedSection delay={0.3}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">
              Amarus Design
            </h2>
            <div className="text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed space-y-4">
              <p>
                Espontánea como la vida misma ha surgido este hermoso proyecto
                en el que incluimos familias artesan@s de diferentes partes del
                mundo. Basado en la confianza y en la amistad, compartimos
                nuestro trabajo,
              </p>
              <p className="font-semibold text-lg md:text-xl">
                Son tiempos de CAMBIOS, es hora de innovar dejando atrás la
                competitividad.
              </p>
              <p>
                En nuestra tienda no solo encontrará joyas hechos por nosotros
                sino también por nuestro equipo. Invertimos parte de nuestras
                ganancias en otros artistas para así poder ofrecerte diversidad y
                calidad, con piedras naturales preseleccionadas por nosotros.
              </p>
              <p>
                Creemos en que la unión es la fuerza y ofrecer productos de otr@s
                compañer@s solo puede enriquecer nuestra marca, en cada
                artículo aclararemos quién ha sido su creador.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}



