import Image from "next/image";
import AnimatedSection from "@/components/AnimatedSection";

export default function PoliticasPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#F5EFFF] to-[#E5D9F2] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection delay={0.2}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-4">
              POLÍTICAS DE LA TIENDA Y ENVÍOS
            </h1>
          </AnimatedSection>
        </div>
      </section>

      {/* Imagen Hero */}
      <section className="relative w-full bg-gray-200">
        <div className="relative w-full">
          <Image
            src="/images/heroes/037.jpg"
            alt="Políticas de la tienda"
            width={1920}
            height={1080}
            className="w-full h-auto object-contain"
            priority={true}
            sizes="100vw"
            quality={90}
          />
        </div>
      </section>

      {/* Contenido Principal */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection delay={0.2}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 text-center">
              Lo que necesitas saber
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed mb-12 text-center">
              En AmarusDesign queremos que nuestros clientes reciban el mejor
              servicio durante su compra para que siempre quieran volver con
              nosotros. Por eso creemos que las políticas de nuestra tienda
              deben ser justas, claras y transparentes. A continuación
              encontrarás una lista con nuestras políticas. Si hay alguna
              información que no se encuentre en la lista,{" "}
              <a
                href="/contacto"
                className="text-[#6B5BB6] hover:text-[#5B4BA5] font-semibold underline"
              >
                contáctanos
              </a>{" "}
              y te ayudaremos.
            </p>
          </AnimatedSection>

          {/* Envíos y Entregas */}
          <AnimatedSection delay={0.3}>
            <div className="mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
                ENVÍOS Y ENTREGAS
              </h3>
              <div className="text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed space-y-4">
                <p>
                  Cada pieza está empaquetada con amor y listo para ser un gran
                  regalo para cualquier ocasión.
                </p>
                <p>
                  Los envíos se realizan desde España mediante correos
                  certificado, de esta manera usted puede asegurarse de que
                  recibirá su paquete en sus manos y tendrá un reembolso
                  completo si su paquete se extraviase.
                </p>
                <div className="bg-[#F5EFFF] p-6 rounded-lg mt-6">
                  <h4 className="font-bold text-gray-800 mb-2">
                    Tiempo de preparación
                  </h4>
                  <p>
                    El tiempo que necesito para preparar un pedido para su envío
                    puede variar. Consulta cada artículo para obtener más
                    información.
                  </p>
                </div>
                <div className="bg-[#F5EFFF] p-6 rounded-lg mt-4">
                  <h4 className="font-bold text-gray-800 mb-2">
                    Aranceles y derechos de aduana
                  </h4>
                  <p>
                    Los compradores pagarán los aranceles y derechos de aduana
                    aplicables. No soy responsable de retrasos debidos a los
                    trámites de aduanas. Dentro de Europa los envíos no pasan por
                    aduana.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Política de Devoluciones */}
          <AnimatedSection delay={0.4}>
            <div className="mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
                NUESTRA POLÍTICA DE DEVOLUCIONES
              </h3>
              <div className="text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed space-y-4">
                <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
                  <p className="font-semibold text-green-800 mb-2">
                    ✓ Aceptamos cambios y devoluciones
                  </p>
                  <p>
                    Ponte en contacto con nosotros en los 14 días posteriores a
                    la entrega.
                  </p>
                  <p>
                    Devuélveme los artículos en los 30 días posteriores a la
                    entrega.
                  </p>
                </div>
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                  <p className="font-semibold text-red-800 mb-2">
                    ✗ No acepto cancelaciones
                  </p>
                  <p>
                    Ponte en contacto conmigo si tienes algún problema con tu
                    pedido.
                  </p>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg">
                  <p className="font-semibold text-yellow-800 mb-2">
                    ⚠ No se pueden cambiar ni devolver los siguientes artículos:
                  </p>
                  <p>
                    Debido a la naturaleza de estos artículos, a menos que
                    lleguen dañados, no acepto devoluciones de Pedidos
                    personalizados
                  </p>
                </div>
                <div className="bg-[#F5EFFF] p-6 rounded-lg mt-4">
                  <h4 className="font-bold text-gray-800 mb-2">
                    Condiciones de devolución
                  </h4>
                  <p>
                    Los gastos de envío de las devoluciones corren a cargo del
                    comprador. Si el artículo no se devuelve en su estado
                    original, el comprador será responsable de cualquier pérdida
                    de su valor.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Privacidad */}
          <AnimatedSection delay={0.5}>
            <div className="mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
                LA PRIVACIDAD EN AMARUSDESIGN
              </h3>
              <div className="text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed space-y-4">
                <p className="font-semibold text-lg md:text-xl">
                  Tus datos están seguros
                </p>
                <div className="bg-[#F5EFFF] p-6 rounded-lg">
                  <h4 className="font-bold text-gray-800 mb-4">
                    POLÍTICA DE PRIVACIDAD DEL SITIO WEB
                  </h4>
                  <p className="mb-2">
                    <strong>www.amarusdesign.com</strong>
                  </p>
                  <p className="mb-4">
                    <strong>I. POLÍTICA DE PRIVACIDAD Y PROTECCIÓN DE DATOS</strong>
                  </p>
                  <p className="mb-4">
                    Respetando lo establecido en la legislación vigente,
                    AmarusDesign (en adelante, también Sitio Web) se compromete
                    a adoptar las medidas técnicas y organizativas necesarias,
                    según el nivel de seguridad adecuado al riesgo de los datos
                    recogidos.
                  </p>
                  <p className="mb-4">
                    <strong>Leyes que incorpora esta política de privacidad</strong>
                  </p>
                  <p className="mb-4">
                    Esta política de privacidad está adaptada a la normativa
                    española y europea vigente en materia de protección de datos
                    personales en internet. En concreto, la misma respeta las
                    siguientes normas:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>
                      El Reglamento (UE) 2016/679 del Parlamento Europeo y del
                      Consejo, de 27 de abril de 2016, relativo a la protección
                      de las personas físicas en lo que respecta al tratamiento
                      de datos personales y a la libre circulación de estos
                      datos (RGPD).
                    </li>
                    <li>
                      La Ley Orgánica 3/2018, de 5 de diciembre, de Protección
                      de Datos Personales y garantía de los derechos digitales
                      (LOPD-GDD).
                    </li>
                    <li>
                      El Real Decreto 1720/2007, de 21 de diciembre, por el que
                      se aprueba el Reglamento de desarrollo de la Ley Orgánica
                      15/1999, de 13 de diciembre, de Protección de Datos de
                      Carácter Personal (RDLOPD).
                    </li>
                    <li>
                      La Ley 34/2002, de 11 de julio, de Servicios de la
                      Sociedad de la Información y de Comercio Electrónico
                      (LSSI-CE).
                    </li>
                  </ul>
                  <p className="mb-4">
                    <strong>
                      Identidad del responsable del tratamiento de los datos
                      personales
                    </strong>
                  </p>
                  <p className="mb-2">
                    El responsable del tratamiento de los datos personales
                    recogidos en AmarusDesign es:
                  </p>
                  <p className="mb-2">
                    <strong>Cristian Andrés Olivera Ibarra</strong>, con NIF:
                    Y2598309J (en adelante, Responsable del tratamiento).
                  </p>
                  <p className="mb-2">Sus datos de contacto son los siguientes:</p>
                  <ul className="list-none space-y-1 mb-4">
                    <li>
                      <strong>Dirección:</strong> C/ La Pardelera no30, 35138
                      Playa Mogán, Las Palmas
                    </li>
                    <li>
                      <strong>Teléfono de contacto:</strong> 0034/634477514
                    </li>
                    <li>
                      <strong>Email de contacto:</strong>{" "}
                      <a
                        href="mailto:amarusdesign2014@gmail.com"
                        className="text-[#6B5BB6] hover:text-[#5B4BA5] underline"
                      >
                        amarusdesign2014@gmail.com
                      </a>
                    </li>
                  </ul>
                  <p className="text-sm text-gray-600 italic">
                    Esta Política de Privacidad fue actualizada el día 8 de
                    mayo 2021 para adaptarse al Reglamento (UE) 2016/679 del
                    Parlamento Europeo y del Consejo, de 27 de abril de 2016,
                    relativo a la protección de las personas físicas en lo que
                    respecta al tratamiento de datos personales y a la libre
                    circulación de estos datos (RGPD) y a la Ley Orgánica
                    3/2018, de 5 de diciembre, de Protección de Datos Personales
                    y garantía de los derechos digitales.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}



