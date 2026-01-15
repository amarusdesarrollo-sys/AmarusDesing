"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    // Simular envío (aquí iría la lógica real de envío)
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      
      // Resetear mensaje después de 5 segundos
      setTimeout(() => {
        setSubmitStatus("idle");
      }, 5000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#F5EFFF] to-[#E5D9F2] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection delay={0.2}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-4">
              CONTACTO
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-gray-700 max-w-2xl mx-auto">
              ¿Tienes alguna pregunta? Estamos aquí para ayudarte. Contáctanos
              y te responderemos lo antes posible.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Información de Contacto */}
            <AnimatedSection delay={0.3}>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">
                  Información de contacto
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <Mail className="h-6 w-6 text-[#6B5BB6]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">Email</h3>
                      <a
                        href="mailto:amarusdesign2014@gmail.com"
                        className="text-base md:text-lg text-gray-700 hover:text-[#6B5BB6] transition-colors"
                      >
                        amarusdesign2014@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <Phone className="h-6 w-6 text-[#6B5BB6]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">Teléfono</h3>
                      <a
                        href="tel:+34634477514"
                        className="text-base md:text-lg text-gray-700 hover:text-[#6B5BB6] transition-colors"
                      >
                        +34 634 477 514
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <MapPin className="h-6 w-6 text-[#6B5BB6]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">Dirección</h3>
                      <p className="text-base md:text-lg text-gray-700">
                        C/ La Pardelera no30
                        <br />
                        35138 Playa Mogán, Las Palmas
                        <br />
                        España
                      </p>
                    </div>
                  </div>

                  <div className="pt-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Síguenos</h3>
                    <a
                      href="https://instagram.com/amarusdesign"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base md:text-lg text-[#6B5BB6] hover:text-[#5B4BA5] transition-colors font-medium"
                    >
                      @amarusdesign
                    </a>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Formulario */}
            <AnimatedSection delay={0.4}>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">
                  Envíanos un mensaje
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Nombre *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent text-base"
                      placeholder="Tu nombre"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent text-base"
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Asunto *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent text-base"
                    >
                      <option value="">Selecciona un asunto</option>
                      <option value="consulta">Consulta general</option>
                      <option value="pedido">Consulta sobre pedido</option>
                      <option value="devolucion">Devolución o cambio</option>
                      <option value="colaboracion">Colaboración</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Mensaje *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B5BB6] focus:border-transparent text-base resize-none"
                      placeholder="Escribe tu mensaje aquí..."
                    />
                  </div>

                  {submitStatus === "success" && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                      ¡Gracias por tu mensaje! Te responderemos pronto.
                    </div>
                  )}

                  {submitStatus === "error" && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                      Hubo un error al enviar el mensaje. Por favor, intenta
                      nuevamente.
                    </div>
                  )}

                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full px-6 py-4 rounded-lg font-bold text-base md:text-lg bg-[#6B5BB6] text-white hover:bg-[#5B4BA5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isSubmitting ? (
                        "Enviando..."
                      ) : (
                        <>
                          Enviar mensaje
                          <Send className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </div>
  );
}

