import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getPostBySlug } from "@/lib/wordpress/api";
import { formatDate, sanitizeContent, stripHtml, getCategoryColor } from "@/lib/utils";
import PageTransition from "@/components/animations/PageTransition";
import CommentSectionClient from "@/components/comments/CommentSectionClient";


interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug).catch(() => null);

  if (!post) return { title: "Not Found" };

  const description = stripHtml(post.excerpt.rendered).slice(0, 160);
  const image = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;

  return {
    title: stripHtml(post.title.rendered),
    description,
    openGraph: {
      title: stripHtml(post.title.rendered),
      description,
      images: image ? [{ url: image }] : [],
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.modified,
    },
    twitter: {
      card: "summary_large_image",
      title: stripHtml(post.title.rendered),
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug).catch(() => null);

  if (!post) notFound();

  const featuredImage = post._embedded?.["wp:featuredmedia"]?.[0];
  const categories = post._embedded?.["wp:term"]?.[0] ?? [];
  const tags = post._embedded?.["wp:term"]?.[1] ?? [];
  const sanitizedContent = sanitizeContent(post.content.rendered);

  return (
    <PageTransition>
      <article className="pt-24 pb-16 min-h-screen">
        {/* 헤더 */}
        <header className="max-w-screen-xl mx-auto px-4 md:px-8 mb-10 md:mb-16">
          <div className="max-w-3xl">
            {/* 카테고리 */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/blog?category=${cat.slug}`}
                  className={`text-xs font-bold uppercase tracking-widest text-white px-3 py-1 ${getCategoryColor(cat.slug, cat.name)} hover:opacity-80 transition-opacity`}
                >
                  {cat.name}
                </Link>
              ))}
              <time className="text-xs text-zinc-500 ml-2">{formatDate(post.date)}</time>
            </div>

            {/* 제목 */}
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-white gs-fade-up"
              dangerouslySetInnerHTML={{ __html: post.title.rendered }}
            />
          </div>
        </header>

        {/* 썸네일 */}
        {featuredImage && (
          <div className="relative w-full h-64 sm:h-80 md:h-[60vh] mb-12 md:mb-20 overflow-hidden gs-fade-up">
            <Image
              src={featuredImage.source_url}
              alt={featuredImage.alt_text || stripHtml(post.title.rendered)}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
          </div>
        )}

        {/* 본문 */}
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="max-w-3xl mx-auto">
            <div
              className="prose prose-invert prose-lg max-w-none
                prose-headings:font-bold prose-headings:tracking-tight
                prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl
                prose-p:leading-relaxed prose-p:text-zinc-300
                prose-a:text-white prose-a:underline prose-a:underline-offset-4
                prose-img:rounded prose-img:my-8
                prose-blockquote:border-l-2 prose-blockquote:border-white prose-blockquote:text-zinc-400
                prose-code:bg-zinc-900 prose-code:text-zinc-200 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800
                gs-fade-up"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />

            {/* 태그 */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-zinc-800 gs-fade-up">
                {tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tag/${tag.slug}`}
                    className="text-xs text-zinc-500 border border-zinc-800 px-3 py-1 hover:text-white hover:border-zinc-600 transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}

            {/* 댓글 */}
            <CommentSectionClient postId={post.id} />

            {/* 뒤로가기 */}
            <div className="mt-12 pt-8 border-t border-zinc-800">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors group"
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                목록으로
              </Link>
            </div>
          </div>
        </div>
      </article>
    </PageTransition>
  );
}
