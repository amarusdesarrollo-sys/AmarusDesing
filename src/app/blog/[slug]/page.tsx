import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { getBlogPostBySlug } from "@/lib/firebase/blog";
import { getCloudinaryUrl } from "@/lib/cloudinary";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post)
    return { title: "Entrada no encontrada", description: "" };
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const imageUrl =
    post.imageUrl ||
    (post.imagePublicId
      ? getCloudinaryUrl(post.imagePublicId, {
          width: 1200,
          height: 630,
          crop: "fill",
        })
      : null);

  return (
    <div className="min-h-screen bg-white">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-[#6B5BB6] hover:text-[#5B4BA5] font-medium mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al blog
        </Link>

        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(post.publishedAt).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            {post.author && (
              <span>Por {post.author}</span>
            )}
          </div>
        </header>

        {imageUrl && (
          <div className="relative aspect-video rounded-xl overflow-hidden mb-10 bg-[#E5D9F2]">
            <Image
              src={imageUrl}
              alt={post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 896px"
            />
          </div>
        )}

        <div className="prose prose-lg max-w-none prose-headings:text-gray-800 prose-p:text-gray-600 prose-a:text-[#6B5BB6] prose-strong:text-gray-800">
          {post.content.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="mt-10 pt-8 border-t border-gray-200 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-[#F5EFFF] text-[#6B5BB6] rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
