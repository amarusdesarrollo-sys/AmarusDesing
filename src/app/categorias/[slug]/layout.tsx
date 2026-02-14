import { Metadata } from "next";
import { getCategoryBySlug } from "@/lib/firebase/categories";
import { buildTitle, getBaseUrl } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: buildTitle("Categoría no encontrada") };

  const name = category.name;
  const description = category.description || `Explora ${name} en AmarusDesign`;
  const baseUrl = getBaseUrl();
  const image = category.imageUrl || category.image;

  return {
    title: buildTitle(name),
    description,
    openGraph: {
      title: `${name} | AmarusDesign`,
      description,
      type: "website",
      url: `${baseUrl}/categorias/${slug}`,
      images: image ? [{ url: image, alt: name }] : undefined,
    },
  };
}

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
