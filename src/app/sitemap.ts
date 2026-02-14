import { MetadataRoute } from "next";
import { getActiveCategories } from "@/lib/firebase/categories";
import { getAllProducts } from "@/lib/firebase/products";
import { getBaseUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/tienda-online`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/carrito`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/contacto`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/politicas`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  let categoryPages: MetadataRoute.Sitemap = [];
  let productPages: MetadataRoute.Sitemap = [];

  try {
    const categories = await getActiveCategories();
    categoryPages = categories.map((c) => ({
      url: `${baseUrl}/categorias/${c.slug}`,
      lastModified: c.updatedAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const products = await getAllProducts();
    productPages = products.map((p) => ({
      url: `${baseUrl}/productos/${p.id}`,
      lastModified: p.updatedAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (e) {
    console.warn("Sitemap: error fetching dynamic data", e);
  }

  return [...staticPages, ...categoryPages, ...productPages];
}
