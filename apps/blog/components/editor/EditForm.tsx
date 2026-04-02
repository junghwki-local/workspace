"use client";

import PostForm from "./PostForm";
import type { WPCategory, WPTag } from "@/lib/wordpress/types";

interface EditFormProps {
  postId: number;
  initialTitle: string;
  initialContent: string;
  initialStatus: "draft" | "publish";
  initialCategories: number[];
  initialTags: number[];
  categories: WPCategory[];
  tags: WPTag[];
}

export default function EditForm(props: EditFormProps) {
  return <PostForm mode="edit" {...props} />;
}
