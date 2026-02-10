/**
 * Schemas reutilizables para User Dashboard y Checkout.
 * Compatibles con Klarna (firstName, lastName, address ISO-2, etc.).
 * No se guardan datos financieros.
 */

import { z } from "zod";

/** Códigos país ISO-2 (Klarna). Se puede ampliar. */
const COUNTRY_ISO2 = z
  .string()
  .length(2, "País debe ser código ISO de 2 letras (ej. ES)")
  .toUpperCase();

/** Perfil de usuario (Mi cuenta → Perfil). Persistido en users/{uid}. */
export const profileSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido").trim(),
  lastName: z.string().min(1, "Los apellidos son requeridos").trim(),
  phone: z.string().optional(),
});
export type ProfileFormData = z.infer<typeof profileSchema>;

/** Dirección compatible con Klarna (shipping/billing). País ISO-2. */
export const addressSchema = z.object({
  street: z.string().min(1, "La calle es requerida").trim(),
  street2: z.string().optional(),
  postalCode: z.string().min(1, "El código postal es requerido").trim(),
  city: z.string().min(1, "La ciudad es requerida").trim(),
  region: z.string().optional(),
  country: COUNTRY_ISO2,
});
export type AddressFormData = z.infer<typeof addressSchema>;

/** Datos de cliente en checkout (Klarna: given_name, family_name, email, phone, address). */
export const checkoutCustomerSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").trim(),
  apellido: z.string().min(1, "El apellido es requerido").trim(),
  email: z.string().email("Email no válido").trim(),
  telefono: z.string().min(1, "El teléfono es requerido (ej: +34 600 111 222)").trim(),
  calle: z.string().min(1, "La dirección es requerida").trim(),
  pisoPuerta: z.string().optional(),
  ciudad: z.string().min(1, "La ciudad es requerida").trim(),
  codigoPostal: z.string().min(1, "El código postal es requerido").trim(),
  pais: z.string().min(1, "El país es requerido").trim().toUpperCase(),
  estado: z.string().optional(),
});
export type CheckoutCustomerFormData = z.infer<typeof checkoutCustomerSchema>;
