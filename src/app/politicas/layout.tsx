import { Metadata } from "next";
import { buildTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: buildTitle("Políticas de la tienda y envíos"),
  description: "Políticas de compra, envíos, devoluciones y condiciones de AmarusDesign.",
};

export default function PoliticasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
