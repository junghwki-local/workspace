"use client";

import PostForm from "./PostForm";
import type { WPCategory, WPTag } from "@/lib/wordpress/types";

interface WriteFormProps {
  categories: WPCategory[];
  tags: WPTag[];
}

export default function WriteForm({ categories, tags }: WriteFormProps) {
  return <PostForm mode="create" categories={categories} tags={tags} />;
}
