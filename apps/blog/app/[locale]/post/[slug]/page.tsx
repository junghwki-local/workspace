import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPostBySlug } from "@/lib/wordpress/api";
import { formatDate, sanitizeContent, stripHtml, getCategoryColor } from "@/lib/utils";
import PageTransition from "@/components/animations/PageTransition";
import CommentSectionClient from "@/components/comments/CommentSectionClient";
import PostAdminActions from "@/components/post/PostAdminActions";
import RelatedPosts from "@/components/post/RelatedPosts";
import ViewCounter from "@/components/post/ViewCounter";
import { getViewCount } from "@/lib/supabase/views";


interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug).catch(() => null);

  if (!post) return { title: "Not Found" };

  const title = stripHtml(post.title.rendered);
  const description = stripHtml(post.excerpt.rendered).slice(0, 160);
  const image = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
  const category = post._embedded?.["wp:term"]?.[0]?.[0]?.name ?? "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const ogImageUrl = `${siteUrl}/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&category=${encodeURIComponent(category)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image ?? ogImageUrl }],
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.modified,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image ?? ogImageUrl],
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const t = await getTranslations("post");
  const { slug } = await params;
  const post = await getPostBySlug(slug).catch(() => null);

  if (!post) notFound();

  const featuredImage = post._embedded?.["wp:featuredmedia"]?.[0];
  const categories = post._embedded?.["wp:term"]?.[0] ?? [];
  const tags = post._embedded?.["wp:term"]?.[1] ?? [];
  const sanitizedContent = sanitizeContent(post.content.rendered);
  const initialViewCount = await getViewCount(post.id).catch(() => 0);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: stripHtml(post.title.rendered),
    description: stripHtml(post.excerpt.rendered).slice(0, 160),
    datePublished: post.date,
    dateModified: post.modified,
    url: `${siteUrl}/post/${slug}`,
    ...(featuredImage && {
      image: {
        "@type": "ImageObject",
        url: featuredImage.source_url,
        width: featuredImage.width,
        height: featuredImage.height,
      },
    }),
    author: { "@type": "Person", name: "Admin" },
    publisher: {
      "@type": "Organization",
      name: "Blog",
      url: siteUrl,
    },
    keywords: tags.map((t) => t.name).join(", "),
  };

  return (
    <PageTransition>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
              <ViewCounter postId={post.id} initialCount={initialViewCount} />
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
            <PostAdminActions postId={post.id} />
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

            {/* 관련 글 */}
            <RelatedPosts currentPostId={post.id} categoryId={categories[0]?.id} />

            {/* 댓글 */}
            <CommentSectionClient postId={post.id} />

            {/* 뒤로가기 */}
            <div className="mt-12 pt-8 border-t border-zinc-800">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors group"
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                {t("backToList")}
              </Link>
            </div>
          </div>
        </div>
      </article>
    </PageTransition>
  );
}
