"use client";

import { useState } from "react";
import AnimatedSection from "@/components/AnimatedSection";
import { trackNewsletterSignup } from "@/lib/analytics";

export default function NewsletterForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          website,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
      } | null;

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "No se pudo suscribir");
      }

      setFeedback({
        type: "success",
        message:
          data.message ||
          "¡Gracias! Te avisaremos de nuestras novedades y ofertas.",
      });
      setFirstName("");
      setLastName("");
      setEmail("");
      trackNewsletterSignup();
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Error al suscribirse. Inténtalo más tarde.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-[#e5d9f2] py-16 md:py-20">
      <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
        <div className="text-center space-y-8 md:space-y-10 w-full flex flex-col items-center">
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
            <form
              onSubmit={handleSubmit}
              className="max-w-lg mx-auto space-y-5 w-full"
            >
              <input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                className="absolute left-[-9999px] h-0 w-0 opacity-0"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="nombre"
                  placeholder="Nombre"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7b6bc7] text-base md:text-lg"
                />
                <input
                  type="text"
                  name="apellido"
                  placeholder="Apellido"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7b6bc7] text-base md:text-lg"
                />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Tu email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7b6bc7] text-base md:text-lg"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6b5bb6] text-white px-8 py-4 rounded-lg hover:bg-[#5b4ba5] transition-colors font-medium text-base md:text-lg disabled:opacity-60"
              >
                {loading ? "Enviando…" : "Suscribirme"}
              </button>
              {feedback && (
                <p
                  role="status"
                  className={`text-sm md:text-base ${
                    feedback.type === "success"
                      ? "text-emerald-800"
                      : "text-red-700"
                  }`}
                >
                  {feedback.message}
                </p>
              )}
            </form>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
