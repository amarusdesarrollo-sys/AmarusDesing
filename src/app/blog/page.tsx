import Link from "next/link";
import Image from "next/image";
import AnimatedSection from "@/components/AnimatedSection";
import { getPublishedBlogPosts } from "@/lib/firebase/blog";
import { getCloudinaryUrl } from "@/lib/cloudinary";
import { Calendar } from "lucide-react";

export const metadata = {
  title: "Blog",
  description:
    "Descubre historias, novedades y consejos sobre joyería artesanal, minerales y macramé.",
};

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts().catch(() => []);

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-[#F5EFFF] to-[#E5D9F2] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection delay={0.2}>
            <h1 className="text-4xl md:5xl lg:text-6xl font-bold text-gray-800 mb-4">
              Blog
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Historias, novedades y consejos sobre joyería artesanal, minerales y macramé
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {posts.length === 0 ? (
            <AnimatedSection delay={0.2}>
              <div className="bg-[#F5EFFF]/50 rounded-2xl p-12 text-center">
                <p className="text-xl text-gray-600 mb-2">
                  Próximamente encontrarás aquí nuestras historias y novedades.
                </p>
                <p className="text-gray-500">
                  Estamos preparando contenido especial para ti.
                </p>
              </div>
            </AnimatedSection>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, i) => {
                const imageUrl =
                  post.imageUrl ||
                  (post.imagePublicId
                    ? getCloudinaryUrl(post.imagePublicId, {
                        width: 600,
                        height: 400,
                        crop: "fill",
                      })
                    : null);
                return (
                  <AnimatedSection key={post.id} delay={0.1 * i}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#6B5BB6]/30"
                    >
                      <div className="aspect-[4/3] bg-[#E5D9F2] relative overflow-hidden">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl text-[#6B5BB6]/40">✿</span>
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <p className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(post.publishedAt).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <h2 className="text-xl font-bold text-gray-800 group-hover:text-[#6B5BB6] transition-colors line-clamp-2">
                          {post.title}
                        </h2>
                        <p className="mt-2 text-gray-600 text-sm line-clamp-3">
                          {post.excerpt}
                        </p>
                      </div>
                    </Link>
                  </AnimatedSection>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
