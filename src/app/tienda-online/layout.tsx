import { Metadata } from "next";
import { buildTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: buildTitle("Tienda Online"),
  description: "Explora nuestras categorías: joyería artesanal, minerales, macramé y más. Cada pieza es única.",
};

export default function TiendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
