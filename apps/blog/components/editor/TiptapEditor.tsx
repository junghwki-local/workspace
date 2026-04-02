"use client";

import { useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json() as { error: string };
      alert(err.error ?? "업로드 실패");
      return null;
    }
    const { url } = await res.json() as { url: string };
    return url;
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "underline" } }),
      Placeholder.configure({ placeholder: "내용을 입력하세요..." }),
      CharacterCount,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none min-h-[400px] focus:outline-none px-0 py-4",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="border border-zinc-800 rounded">
      {/* 툴바 */}
      <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-zinc-800 bg-zinc-950">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="굵게"
        >
          B
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="기울임"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="취소선"
        >
          <s>S</s>
        </ToolbarButton>
        <div className="w-px bg-zinc-800 mx-1" />
        {([1, 2, 3] as const).map((level) => (
          <ToolbarButton
            key={level}
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
            active={editor.isActive("heading", { level })}
            title={`H${level}`}
          >
            H{level}
          </ToolbarButton>
        ))}
        <div className="w-px bg-zinc-800 mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="목록"
        >
          •—
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="번호 목록"
        >
          1.
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="인용"
        >
          "
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          title="코드 블록"
        >
          {"</>"}
        </ToolbarButton>
        <div className="w-px bg-zinc-800 mx-1" />
        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          active={false}
          title="이미지 업로드"
        >
          IMG
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            e.target.value = "";
            const url = await handleImageUpload(file);
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }}
        />
        <ToolbarButton
          onClick={() => {
            const url = prompt("링크 URL:");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          active={editor.isActive("link")}
          title="링크"
        >
          ↗
        </ToolbarButton>
        <div className="flex-1" />
        <span className="text-xs text-zinc-600 self-center">
          {editor.storage.characterCount.characters()}자
        </span>
      </div>

      {/* 에디터 본문 */}
      <div className="px-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
        active ? "bg-white text-black" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}
