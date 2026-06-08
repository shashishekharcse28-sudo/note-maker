"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { useEffect } from "react";

// ─── Toolbar button component ────────────────────────────────────────────────
interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "28px",
        height: "28px",
        borderRadius: "6px",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        background: isActive ? "rgba(99,102,241,0.18)" : "transparent",
        color: isActive ? "#6366f1" : "#6b6b8a",
        fontSize: "0.8rem",
        fontWeight: "600",
        transition: "all 0.15s",
        opacity: disabled ? 0.35 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.background = isActive
            ? "rgba(99,102,241,0.25)"
            : "rgba(0,0,0,0.06)";
          (e.currentTarget as HTMLButtonElement).style.color = "#4f46e5";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = isActive
          ? "rgba(99,102,241,0.18)"
          : "transparent";
        (e.currentTarget as HTMLButtonElement).style.color = isActive ? "#6366f1" : "#6b6b8a";
      }}
    >
      {children}
    </button>
  );
}

// ─── Toolbar separator ───────────────────────────────────────────────────────
function ToolbarSep() {
  return (
    <div
      style={{
        width: "1px",
        height: "20px",
        background: "rgba(0,0,0,0.1)",
        margin: "0 4px",
        flexShrink: 0,
      }}
    />
  );
}

// ─── Word count ──────────────────────────────────────────────────────────────
function WordCount({ text }: { text: string }) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.replace(/\s/g, "").length;
  return (
    <span
      style={{
        fontSize: "0.7rem",
        color: "#a0a0b8",
        fontFamily: "'Inter', sans-serif",
        letterSpacing: "0.02em",
      }}
    >
      {words} words · {chars} chars
    </span>
  );
}

// ─── Main TipTap Editor component ───────────────────────────────────────────
export default function TipTapEditor() {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "Start writing your notes… (use # for headings)",
      }),
      Typography,
    ],
    content: `<h1>My Study Notes</h1><p>Start writing here. Use the toolbar above or Markdown shortcuts.</p>`,
    editorProps: {
      attributes: {
        class: "tiptap-prose",
        spellcheck: "true",
      },
    },
  });

  // Auto-focus on mount
  useEffect(() => {
    if (editor) {
      setTimeout(() => editor.commands.focus("end"), 100);
    }
  }, [editor]);

  if (!editor) return null;

  const plainText = editor.getText();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--paper-bg)",
      }}
    >
      {/* ── Toolbar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2px",
          padding: "8px 16px",
          background: "#f4f3f8",
          borderBottom: "1px solid #e5e4f0",
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        {/* History */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          ↩
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          ↪
        </ToolbarButton>

        <ToolbarSep />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          H3
        </ToolbarButton>

        <ToolbarSep />

        {/* Inline marks */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Bold"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Italic"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title="Strikethrough"
        >
          <s>S</s>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          title="Inline code"
        >
          {"<>"}
        </ToolbarButton>

        <ToolbarSep />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Bullet list"
        >
          •≡
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Ordered list"
        >
          1≡
        </ToolbarButton>

        <ToolbarSep />

        {/* Blocks */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Blockquote"
        >
          ❝
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive("codeBlock")}
          title="Code block"
        >
          ⌨
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Divider"
        >
          ─
        </ToolbarButton>

        {/* spacer + word count */}
        <div style={{ flex: 1 }} />
        <WordCount text={plainText} />
      </div>

      {/* ── Editor area ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "40px 56px 80px",
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
