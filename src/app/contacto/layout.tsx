import { Metadata } from "next";
import { buildTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: buildTitle("Contacto"),
  description: "Contáctanos para consultas, pedidos personalizados o información sobre nuestros productos artesanales.",
};

export default function ContactoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
