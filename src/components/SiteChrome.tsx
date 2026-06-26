import { getActiveCategories } from "@/lib/firebase/categories";
import { getSiteConfig } from "@/lib/firebase/site-config";
import ConditionalSiteChrome from "@/components/ConditionalSiteChrome";

/** Carga categorías y config en el servidor (una sola vez por request). */
export default async function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const [initialCategories, initialSiteConfig] = await Promise.all([
    getActiveCategories().catch(() => []),
    getSiteConfig().catch(() => null),
  ]);

  return (
    <ConditionalSiteChrome
      initialCategories={initialCategories}
      initialSiteConfig={initialSiteConfig}
    >
      {children}
    </ConditionalSiteChrome>
  );
}
