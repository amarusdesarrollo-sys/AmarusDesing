/**
 * Países del desplegable de checkout y Mi cuenta → Direcciones (misma lista).
 */

export type CheckoutCountryGroup = {
  label: string;
  options: { value: string; label: string }[];
};

export const CHECKOUT_COUNTRY_SELECT_GROUPS: CheckoutCountryGroup[] = [
  {
    label: "Europa",
    options: [
      { value: "ES", label: "España" },
      { value: "PT", label: "Portugal" },
      { value: "FR", label: "Francia" },
      { value: "IT", label: "Italia" },
      { value: "DE", label: "Alemania" },
      { value: "BE", label: "Bélgica" },
      { value: "NL", label: "Países Bajos" },
      { value: "LU", label: "Luxemburgo" },
      { value: "AT", label: "Austria" },
      { value: "IE", label: "Irlanda" },
      { value: "DK", label: "Dinamarca" },
      { value: "SE", label: "Suecia" },
      { value: "NO", label: "Noruega" },
      { value: "FI", label: "Finlandia" },
      { value: "PL", label: "Polonia" },
      { value: "CZ", label: "Chequia" },
      { value: "SK", label: "Eslovaquia" },
      { value: "HU", label: "Hungría" },
      { value: "RO", label: "Rumanía" },
      { value: "BG", label: "Bulgaria" },
      { value: "GR", label: "Grecia" },
      { value: "SI", label: "Eslovenia" },
      { value: "HR", label: "Croacia" },
      { value: "EE", label: "Estonia" },
      { value: "LV", label: "Letonia" },
      { value: "LT", label: "Lituania" },
      { value: "CY", label: "Chipre" },
      { value: "MT", label: "Malta" },
      { value: "GB", label: "Reino Unido" },
    ],
  },
  {
    label: "América",
    options: [
      { value: "US", label: "Estados Unidos" },
      { value: "CA", label: "Canadá" },
      { value: "MX", label: "México" },
      { value: "AR", label: "Argentina" },
      { value: "CL", label: "Chile" },
      { value: "BR", label: "Brasil" },
      { value: "CO", label: "Colombia" },
      { value: "PE", label: "Perú" },
      { value: "UY", label: "Uruguay" },
    ],
  },
  {
    label: "Asia, Oceanía y África",
    options: [
      { value: "AU", label: "Australia" },
      { value: "NZ", label: "Nueva Zelanda" },
      { value: "JP", label: "Japón" },
      { value: "CN", label: "China" },
      { value: "IN", label: "India" },
      { value: "ZA", label: "Sudáfrica" },
      { value: "MA", label: "Marruecos" },
      { value: "OTHER", label: "Otro país" },
    ],
  },
];

/** Lista plana (mismo orden que en checkout). */
export const CHECKOUT_COUNTRY_OPTIONS = CHECKOUT_COUNTRY_SELECT_GROUPS.flatMap(
  (g) => g.options
);

export function getCheckoutCountryLabel(value: string): string {
  const v = value.trim().toUpperCase();
  const hit = CHECKOUT_COUNTRY_OPTIONS.find((o) => o.value === v);
  return hit?.label ?? v;
}

/** Normaliza valor del formulario antes de validar / guardar. */
export function normalizeAddressCountryInput(raw: string | undefined): string {
  const s = (raw ?? "ES").toString().trim().toUpperCase();
  if (s === "OTHER") return "OTHER";
  return s.slice(0, 2);
}
