import { Metadata } from "next";
import { getProductById } from "@/lib/firebase/products";
import { buildTitle, getBaseUrl } from "@/lib/seo";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: buildTitle("Producto no encontrado") };

  const title = product.seo?.title || product.name;
  const description =
    product.seo?.description || product.description?.slice(0, 160) || "";
  const image =
    product.seo?.openGraph?.image ||
    product.images?.find((i) => i.isPrimary)?.url ||
    product.images?.[0]?.url;
  const baseUrl = getBaseUrl();

  return {
    title: buildTitle(title),
    description,
    keywords: product.seo?.keywords || product.tags,
    openGraph: {
      title: product.seo?.openGraph?.title || product.name,
      description: product.seo?.openGraph?.description || description,
      type: "website",
      images: image ? [{ url: image, alt: product.name }] : undefined,
      url: `${baseUrl}/productos/${id}`,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
    },
  };
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
