import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShippingConfigLoader from "@/components/ShippingConfigLoader";

export const metadata = {
  title: "AmarusDesign - Joyería Artesanal y Minerales",
  description:
    "Descubre joyería artesanal única, minerales del mundo y macramé hecho a mano. Cada pieza cuenta una historia de artesanos apasionados.",
  keywords: [
    "joyería artesanal",
    "minerales",
    "macramé",
    "piedras naturales",
    "joyería única",
  ],
  openGraph: {
    title: "AmarusDesign - Joyería Artesanal y Minerales",
    description:
      "Descubre joyería artesanal única, minerales del mundo y macramé hecho a mano.",
    type: "website",
    locale: "es_ES",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col">
        <ShippingConfigLoader />
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
