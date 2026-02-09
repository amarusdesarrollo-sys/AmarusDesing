"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save } from "lucide-react";
import { getSiteConfig, updateSiteConfig } from "@/lib/firebase/site-config";
import type { SiteConfig } from "@/types";

const configSchema = z.object({
  socialMedia: z.object({
    instagram: z.string().optional(),
    email: z.string().email("Email no válido").optional().or(z.literal("")),
  }),
  contact: z.object({
    email: z.string().email("Email no válido").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
      state: z.string().optional(),
    }),
  }),
  shipping: z.object({
    freeShippingThreshold: z.number().min(0),
    standardShippingCost: z.number().min(0),
    expressShippingCost: z.number().min(0),
  }),
});

type ConfigFormData = z.infer<typeof configSchema>;

export default function AdminConfiguracionPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const config = await getSiteConfig();
      reset({
        socialMedia: {
          instagram: config.socialMedia.instagram,
          email: config.socialMedia.email,
        },
        contact: {
          email: config.contact.email,
          phone: config.contact.phone || "",
          address: {
            street: config.contact.address.street,
            city: config.contact.address.city,
            postalCode: config.contact.address.postalCode,
            country: config.contact.address.country,
            state: config.contact.address.state || "",
          },
        },
        // Mostrar en euros (Firestore guarda en céntimos)
        shipping: {
          freeShippingThreshold: (config.shipping.freeShippingThreshold ?? 0) / 100,
          standardShippingCost: (config.shipping.standardShippingCost ?? 0) / 100,
          expressShippingCost: (config.shipping.expressShippingCost ?? 0) / 100,
        },
      });
    } catch (err) {
      setError("Error al cargar la configuración");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ConfigFormData) => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await updateSiteConfig({
        socialMedia: {
          instagram: data.socialMedia.instagram || "",
          email: data.socialMedia.email || "",
        },
        contact: {
          email: data.contact.email || "",
          phone: data.contact.phone || undefined,
          address: {
            street: data.contact.address.street || "",
            city: data.contact.address.city || "",
            postalCode: data.contact.address.postalCode || "",
            country: data.contact.address.country || "",
            state: data.contact.address.state || undefined,
          },
        },
        // Guardar en céntimos (el formulario está en euros)
        shipping: {
          freeShippingThreshold: Math.round((data.shipping.freeShippingThreshold ?? 0) * 100),
          standardShippingCost: Math.round((data.shipping.standardShippingCost ?? 0) * 100),
          expressShippingCost: Math.round((data.shipping.expressShippingCost ?? 0) * 100),
        },
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (cents: number) => (cents / 100).toFixed(2);

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B5BB6]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Configuración del Sitio
        </h1>
        <p className="text-gray-600">
          Gestiona los datos de contacto, redes sociales y configuración general
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          ✅ Configuración guardada correctamente
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Redes Sociales */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Redes Sociales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instagram
              </label>
              <input
                {...register("socialMedia.instagram")}
                placeholder="@amarusdesign o URL"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email público
              </label>
              <input
                {...register("socialMedia.email")}
                type="email"
                placeholder="contacto@amarusdesign.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
              />
              {errors.socialMedia?.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.socialMedia.email.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Contacto</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email de contacto
                </label>
                <input
                  {...register("contact.email")}
                  type="email"
                  placeholder="contacto@amarusdesign.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
                />
                {errors.contact?.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.contact.email.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  {...register("contact.phone")}
                  placeholder="+34 600 111 222"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <div className="space-y-2">
                <input
                  {...register("contact.address.street")}
                  placeholder="Calle y número"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    {...register("contact.address.city")}
                    placeholder="Ciudad"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
                  />
                  <input
                    {...register("contact.address.postalCode")}
                    placeholder="CP"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    {...register("contact.address.state")}
                    placeholder="Provincia"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
                  />
                  <input
                    {...register("contact.address.country")}
                    placeholder="País"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Envíos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Configuración de Envíos
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Umbral para envío gratis (€)
              </label>
              <input
                {...register("shipping.freeShippingThreshold", {
                  valueAsNumber: true,
                })}
                type="number"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
              />
              <p className="mt-1 text-xs text-gray-500">
                0 = no hay envío gratis. Si pones un monto (ej. 50), los pedidos que superen ese importe tendrán envío gratis.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo envío estándar (€)
                </label>
                <input
                  {...register("shipping.standardShippingCost", {
                    valueAsNumber: true,
                  })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Coste que se cobra si el pedido no alcanza el umbral de envío gratis. 0 = envío gratis siempre.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo envío express (€)
                </label>
                <input
                  {...register("shipping.expressShippingCost", {
                    valueAsNumber: true,
                  })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B5BB6]"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Por si más adelante ofreces envío express (opcional).
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#6B5BB6] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#5B4BA5] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="h-5 w-5" />
            {saving ? "Guardando..." : "Guardar Configuración"}
          </button>
        </div>
      </form>
    </div>
  );
}
