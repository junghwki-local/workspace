export interface WPMedia {
  source_url: string;
  alt_text: string;
  width: number;
  height: number;
}

export interface WPTerm {
  id: number;
  name: string;
  slug: string;
  taxonomy: string;
}

export interface WPPost {
  id: number;
  slug: string;
  status: string;
  date: string;
  modified: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  featured_media: number;
  categories: number[];
  tags: number[];
  _embedded?: {
    "wp:featuredmedia"?: WPMedia[];
    "wp:term"?: WPTerm[][];
  };
}

export interface WPCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
  description: string;
}

export interface WPTag {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface PostsResponse {
  posts: WPPost[];
  total: number;
  totalPages: number;
}
