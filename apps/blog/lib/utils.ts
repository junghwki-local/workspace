import sanitizeHtml from "sanitize-html";

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function sanitizeContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img", "figure", "figcaption", "iframe", "video", "source",
      "h1", "h2", "h3", "h4", "h5", "h6",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "width", "height", "class", "loading"],
      iframe: ["src", "width", "height", "frameborder", "allowfullscreen"],
      "*": ["class", "id"],
    },
    allowedIframeHostnames: ["www.youtube.com", "player.vimeo.com"],
  });
}

export function stripHtml(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
}

const CATEGORY_COLORS: Record<string, string> = {
  개발: "bg-red-600",
  dev: "bg-red-600",
  development: "bg-red-600",
  물건: "bg-yellow-400",
  gear: "bg-yellow-400",
  독서: "bg-stone-600",
  book: "bg-stone-600",
  생각: "bg-zinc-800",
  think: "bg-zinc-800",
  여행: "bg-blue-600",
  travel: "bg-blue-600",
};

export function getCategoryColor(slug: string, name: string): string {
  return (
    CATEGORY_COLORS[slug] ??
    CATEGORY_COLORS[name] ??
    "bg-zinc-700"
  );
}
