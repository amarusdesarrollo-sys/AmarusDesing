import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShippingConfigLoader from "@/components/ShippingConfigLoader";
import { buildTitle, SITE_DESCRIPTION, SITE_KEYWORDS, getBaseUrl } from "@/lib/seo";

const baseUrl = getBaseUrl();

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: buildTitle(),
    template: `%s | AmarusDesign`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: "AmarusDesign" }],
  creator: "AmarusDesign",
  openGraph: {
    title: "AmarusDesign - Joyería Artesanal y Minerales",
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "es_ES",
    url: baseUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "AmarusDesign - Joyería Artesanal y Minerales",
    description: SITE_DESCRIPTION,
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
