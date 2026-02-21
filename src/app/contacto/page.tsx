import { getSiteConfig } from "@/lib/firebase/site-config";
import { getContactoContent } from "@/lib/firebase/content";
import ContactoClient from "@/components/ContactoClient";

export default async function ContactoPage() {
  const [config, content] = await Promise.all([
    getSiteConfig().catch(() => null),
    getContactoContent().catch(() => null),
  ]);

  const heroTitle = content?.heroTitle ?? "CONTACTO";
  const heroSubtitle =
    content?.heroSubtitle ??
    "¿Tienes alguna pregunta? Estamos aquí para ayudarte. Contáctanos y te responderemos lo antes posible.";
  const email = config?.contact?.email || config?.socialMedia?.email || "amarusdesign2014@gmail.com";
  const phone = config?.contact?.phone || "+34 634 477 514";
  const address = config?.contact?.address ?? {
    street: "C/ La Pardelera no30",
    city: "Playa Mogán, Las Palmas",
    postalCode: "35138",
    country: "España",
  };
  const instagram = config?.socialMedia?.instagram || "amarusdesign";

  return (
    <ContactoClient
      heroTitle={heroTitle}
      heroSubtitle={heroSubtitle}
      email={email}
      phone={phone}
      address={address}
      instagram={instagram}
    />
  );
}
