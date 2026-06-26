import type { Category } from "@/types";
import CategoryHeroSection from "@/components/CategoryHeroSection";

/** Heroes de categorías destacadas (datos desde el servidor). */
export default function FeaturedCategoriesHero({
  categories,
}: {
  categories: Category[];
}) {
  if (!categories.length) {
    return null;
  }

  return (
    <>
      {categories.map((category, index) => (
        <CategoryHeroSection
          key={category.id}
          category={category}
          index={index}
        />
      ))}
    </>
  );
}
