"use client";

import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { useEffect, useRef, useState, useCallback } from "react";
import React from "react";

// ─── Persistence ───────────────────────────────────────────────────────────────
const EDITOR_STORAGE_KEY = "studyos-editor-content";
const SAVE_DEBOUNCE_MS = 1000;

function loadSavedContent(): object | string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(EDITOR_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

// ─── Slash command definitions ─────────────────────────────────────────────────
interface SlashCmd {
  id: string;
  label: string;
  description: string;
  icon: string;
  shortcut?: string;
  run: (editor: any, from: number, to: number) => void;
}

const SLASH_CMDS: SlashCmd[] = [
  { id: "h1", label: "Heading 1",     description: "Big section title",       icon: "H1",  shortcut: "#",
    run: (e, f, t) => e.chain().focus().deleteRange({ from: f, to: t }).setHeading({ level: 1 }).run() },
  { id: "h2", label: "Heading 2",     description: "Medium section title",    icon: "H2",  shortcut: "##",
    run: (e, f, t) => e.chain().focus().deleteRange({ from: f, to: t }).setHeading({ level: 2 }).run() },
  { id: "h3", label: "Heading 3",     description: "Small section title",     icon: "H3",  shortcut: "###",
    run: (e, f, t) => e.chain().focus().deleteRange({ from: f, to: t }).setHeading({ level: 3 }).run() },
  { id: "bullet", label: "Bullet List", description: "Unordered list",        icon: "•≡",  shortcut: "-",
    run: (e, f, t) => e.chain().focus().deleteRange({ from: f, to: t }).toggleBulletList().run() },
  { id: "ordered", label: "Numbered List", description: "Ordered list",       icon: "1≡",  shortcut: "1.",
    run: (e, f, t) => e.chain().focus().deleteRange({ from: f, to: t }).toggleOrderedList().run() },
  { id: "code",  label: "Code Block",  description: "Syntax highlighted code", icon: "</>",
    run: (e, f, t) => e.chain().focus().deleteRange({ from: f, to: t }).toggleCodeBlock().run() },
  { id: "quote", label: "Blockquote",  description: "Quote or callout text",  icon: "❝",
    run: (e, f, t) => e.chain().focus().deleteRange({ from: f, to: t }).toggleBlockquote().run() },
  { id: "divider", label: "Divider",  description: "Horizontal separator",    icon: "─",
    run: (e, f, t) => e.chain().focus().deleteRange({ from: f, to: t }).setHorizontalRule().run() },
];

// ─── Slash state (managed outside React to avoid re-render loops) ──────────────
interface SlashInfo {
  active: boolean;
  query: string;
  from: number;   // doc position of "/"
  to: number;     // doc position of cursor
  x: number;
  y: number;
}

const SLASH_INACTIVE: SlashInfo = { active: false, query: "", from: 0, to: 0, x: 0, y: 0 };

// ─── Slash ProseMirror Plugin ──────────────────────────────────────────────────
// The plugin detects "/" typing purely from ProseMirror state (no DOM events).
// It notifies the React component via a stable callback ref — never via setState
// inside the update loop.
function makeSlashPlugin(notify: React.MutableRefObject<(info: SlashInfo) => void>) {
  // Last-emitted snapshot for identity-diffing
  let last: SlashInfo = SLASH_INACTIVE;

  function emit(info: SlashInfo) {
    // Only call notify when something actually changed
    if (
      info.active === last.active &&
      info.query  === last.query  &&
      info.from   === last.from
    ) return;
    last = info;
    // Schedule outside the PM dispatch cycle so React setState is safe
    Promise.resolve().then(() => notify.current(info));
  }

  return new Plugin({
    key: new PluginKey("studyos-slash"),
    view(view) {
      return {
        update() {
          const { state } = view;
          const { selection } = state;

          // Only act on collapsed cursor
          if (!selection.empty) { emit(SLASH_INACTIVE); return; }

          const { $from } = selection;
          // Read text from start of current line to cursor (max 80 chars)
          const lineText = $from.parent.textBetween(
            Math.max(0, $from.parentOffset - 80),
            $from.parentOffset,
            "\0", "\0"
          );

          // Match "/" optionally preceded by start-of-line or whitespace
          const m = /(^|[\s\0])\/([a-zA-Z0-9]*)$/.exec(lineText);
          if (!m) { emit(SLASH_INACTIVE); return; }

          const query = m[2];
          // Compute absolute doc position of "/" character
          const charsBeforeSlash = lineText.length - m[0].length + m[1].length;
          const slashDocPos = $from.start() + Math.max(0, $from.parentOffset - 80) + charsBeforeSlash;

          const coords = view.coordsAtPos($from.pos);
          emit({
            active: true,
            query,
            from: slashDocPos,
            to: $from.pos,
            x: coords.left,
            y: coords.bottom + 4,
          });
        },
        destroy() { emit(SLASH_INACTIVE); },
      };
    },
  });
}

// ─── Drag-Handle ProseMirror Plugin ───────────────────────────────────────────
// Attaches absolutely-positioned drag handles next to each top-level block.
// Uses HTML5 drag-and-drop; manipulates the PM document on drop.
const dragHandleKey = new PluginKey("studyos-drag");

function makeDragPlugin() {
  return new Plugin({
    key: dragHandleKey,
    view(editorView) {
      let handles: HTMLElement[] = [];
      let dragFrom: number | null = null;   // top-level block index being dragged
      let rafId = 0;

      function topLevelBlocks(): { el: HTMLElement; nodeSize: number; pos: number }[] {
        const result: { el: HTMLElement; nodeSize: number; pos: number }[] = [];
        const dom = editorView.dom;
        let pos = 0;
        editorView.state.doc.forEach((node, offset) => {
          const childEls = Array.from(dom.children) as HTMLElement[];
          // Match by order (PM children ↔ DOM children are 1-to-1 for top-level)
          const el = childEls[result.length];
          if (el) result.push({ el, nodeSize: node.nodeSize, pos: offset });
        });
        return result;
      }

      function clear() {
        handles.forEach(h => h.remove());
        handles = [];
      }

      function rebuild() {
        clear();
        const container = editorView.dom.parentElement;
        if (!container) return;
        container.style.position = "relative";

        const blocks = topLevelBlocks();
        const containerRect = container.getBoundingClientRect();

        blocks.forEach((block, idx) => {
          const rect = block.el.getBoundingClientRect();

          const handle = document.createElement("button");
          handle.type = "button";
          handle.textContent = "⠿";
          handle.setAttribute("aria-label", "Drag to reorder");
          handle.className = "studyos-drag-handle";
          Object.assign(handle.style, {
            position:   "absolute",
            left:       `${rect.left - containerRect.left - 22}px`,
            top:        `${rect.top  - containerRect.top  + 2}px`,
            width:      "18px",
            height:     "22px",
            display:    "flex",
            alignItems: "center",
            justifyContent: "center",
            border:     "none",
            background: "transparent",
            cursor:     "grab",
            color:      "var(--brand-400, #818cf8)",
            opacity:    "0",
            transition: "opacity 0.15s",
            fontSize:   "13px",
            padding:    "0",
            zIndex:     "20",
            borderRadius: "4px",
          });

          // Visibility: fade in on block hover, full opacity on handle hover
          block.el.addEventListener("mouseenter", () => { handle.style.opacity = "0.4"; });
          block.el.addEventListener("mouseleave", () => { handle.style.opacity = "0"; });
          handle.addEventListener("mouseenter",   () => { handle.style.opacity = "1"; });
          handle.addEventListener("mouseleave",   () => { handle.style.opacity = "0.4"; });

          // ── Drag ──
          handle.draggable = true;
          handle.addEventListener("dragstart", (e) => {
            dragFrom = idx;
            handle.style.cursor = "grabbing";
            e.dataTransfer!.effectAllowed = "move";
            e.dataTransfer!.setData("text/plain", String(idx));
          });
          handle.addEventListener("dragend", () => {
            dragFrom = null;
            handle.style.cursor = "grab";
          });

          // ── Drop zone on the block ──
          block.el.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer!.dropEffect = "move";
            block.el.style.outline = "2px solid rgba(99,102,241,0.4)";
            block.el.style.borderRadius = "6px";
          });
          block.el.addEventListener("dragleave", () => {
            block.el.style.outline = "";
          });
          block.el.addEventListener("drop", (e) => {
            e.preventDefault();
            block.el.style.outline = "";
            if (dragFrom === null || dragFrom === idx) return;
            swapBlocks(dragFrom, idx);
            dragFrom = null;
          });

          container.appendChild(handle);
          handles.push(handle);
        });
      }

      function swapBlocks(fromIdx: number, toIdx: number) {
        const { state, dispatch } = editorView;
        const positions: Array<{ node: any; pos: number }> = [];
        state.doc.forEach((node, pos) => positions.push({ node, pos }));

        if (fromIdx >= positions.length || toIdx >= positions.length) return;

        const src = positions[fromIdx];
        const dst = positions[toIdx];
        const srcNode = src.node;
        const tr = state.tr;

        if (fromIdx > toIdx) {
          // moving up: delete first (higher pos), then insert at dst
          tr.delete(src.pos, src.pos + srcNode.nodeSize);
          tr.insert(dst.pos, srcNode);
        } else {
          // moving down: insert after dst, then delete src (lower pos)
          tr.insert(dst.pos + dst.node.nodeSize, srcNode);
          tr.delete(src.pos, src.pos + srcNode.nodeSize);
        }

        dispatch(tr.setMeta("addToHistory", false));
      }

      // Debounce rebuilds so rapid typing doesn't thrash
      function scheduleRebuild() {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(rebuild);
      }

      setTimeout(rebuild, 150);

      return {
        update: scheduleRebuild,
        destroy() { cancelAnimationFrame(rafId); clear(); },
      };
    },
  });
}

// ─── Slash Menu Component ──────────────────────────────────────────────────────
function SlashMenu({
  info, editor, onClose,
}: { info: SlashInfo; editor: any; onClose: () => void }) {
  const [sel, setSel] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const filtered = SLASH_CMDS.filter(
    c => !info.query || c.label.toLowerCase().startsWith(info.query.toLowerCase())
  );

  // Reset highlight when query changes
  useEffect(() => setSel(0), [info.query]);

  // Scroll highlighted item into view
  useEffect(() => { refs.current[sel]?.scrollIntoView({ block: "nearest" }); }, [sel]);

  // Keyboard navigation (capture phase so it wins over the editor)
  useEffect(() => {
    if (!info.active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown")  { e.preventDefault(); setSel(i => Math.min(i + 1, filtered.length - 1)); return; }
      if (e.key === "ArrowUp")    { e.preventDefault(); setSel(i => Math.max(i - 1, 0)); return; }
      if (e.key === "Escape")     { e.preventDefault(); onClose(); return; }
      if (e.key === "Enter")      {
        e.preventDefault(); e.stopPropagation();
        if (filtered[sel]) execute(filtered[sel]);
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [info.active, info.query, sel, filtered.length]);

  function execute(cmd: SlashCmd) {
    cmd.run(editor, info.from, info.to);
    onClose();
  }

  if (!info.active || filtered.length === 0) return null;

  const top  = Math.min(info.y, window.innerHeight - 340);
  const left = Math.max(8, Math.min(info.x, window.innerWidth - 276));

  return (
    <div
      onMouseDown={e => e.preventDefault()}
      style={{
        position: "fixed", top, left,
        zIndex: 99999,
        width: "272px",
        maxHeight: "320px",
        overflowY: "auto",
        background: "#1e1e28",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: "12px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
        backdropFilter: "blur(24px)",
        padding: "6px",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Label */}
      <div style={{ padding: "3px 10px 5px", fontSize: "0.62rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.09em" }}>
        {info.query ? `"${info.query}" — ${filtered.length} result${filtered.length !== 1 ? "s" : ""}` : "Blocks"}
      </div>

      {filtered.map((cmd, i) => (
        <button
          key={cmd.id}
          ref={el => { refs.current[i] = el; }}
          onMouseDown={e => { e.preventDefault(); execute(cmd); }}
          onMouseEnter={() => setSel(i)}
          style={{
            display: "flex", alignItems: "center", gap: "10px",
            width: "100%", padding: "7px 10px", borderRadius: "8px",
            border: "none", cursor: "pointer",
            background: i === sel ? "rgba(99,102,241,0.18)" : "transparent",
            color:      i === sel ? "#a5b4fc" : "rgba(255,255,255,0.7)",
            textAlign: "left", transition: "background 0.08s",
          }}
        >
          {/* Icon chip */}
          <span style={{
            width: "30px", height: "30px", borderRadius: "7px", flexShrink: 0,
            background: i === sel ? "rgba(99,102,241,0.22)" : "rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: cmd.icon.length > 2 ? "0.6rem" : "0.75rem",
            fontWeight: 700,
            color: i === sel ? "#818cf8" : "rgba(255,255,255,0.45)",
          }}>
            {cmd.icon}
          </span>
          {/* Text */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 500 }}>{cmd.label}</div>
            <div style={{ fontSize: "0.67rem", color: "rgba(255,255,255,0.33)", marginTop: "1px" }}>{cmd.description}</div>
          </div>
          {/* Shortcut */}
          {cmd.shortcut && (
            <span style={{ fontSize: "0.6rem", fontFamily: "monospace", color: "rgba(255,255,255,0.22)", flexShrink: 0 }}>
              {cmd.shortcut}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}



// ─── Main component ─────────────────────────────────────────────────────────────
export default function TipTapEditor() {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Slash state ──
  // slashInfo is stored in a ref so the PM plugin can read/write it without
  // causing re-renders. We copy to React state only when active/inactive transitions.
  const slashInfoRef  = useRef<SlashInfo>(SLASH_INACTIVE);
  const [slashActive, setSlashActive] = useState(false);
  const [slashInfo,   setSlashInfo  ] = useState<SlashInfo>(SLASH_INACTIVE);

  // Stable callback for the PM plugin — never recreated
  const notifyRef = useRef<(info: SlashInfo) => void>((info) => {
    slashInfoRef.current = info;
    // Only trigger React re-render on active/inactive flip, or query change
    setSlashInfo(prev => {
      if (prev.active === info.active && prev.query === info.query && prev.from === info.from) return prev;
      return info;
    });
    setSlashActive(info.active);
  });

  // ── Editor setup ──
  const savedContent = loadSavedContent();
  const initialContent = savedContent
    ?? `<h1>My Study Notes</h1><p>Start writing here. Type <strong>/</strong> for commands.</p>`;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "Type / for commands…" }),
      Typography,
      // Slash extension
      Extension.create({
        name: "slashCommand",
        addProseMirrorPlugins: () => [makeSlashPlugin(notifyRef)],
      }),
      // Drag-handle extension
      Extension.create({
        name: "dragHandle",
        addProseMirrorPlugins: () => [makeDragPlugin()],
      }),
    ],
    content: initialContent,
    editorProps: { attributes: { class: "tiptap-prose", spellcheck: "true" } },
    onUpdate: ({ editor: ed }) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        try { localStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify(ed.getJSON())); } catch {}
      }, SAVE_DEBOUNCE_MS);
    },
  });

  useEffect(() => { if (editor) setTimeout(() => editor.commands.focus("end"), 120); }, [editor]);
  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }, []);

  const closeSlash = useCallback(() => {
    notifyRef.current(SLASH_INACTIVE);
    editor?.commands.focus();
  }, [editor]);

  if (!editor) return null;

  return (
    <>
      <style>{`
        .studyos-drag-handle { user-select: none; }
        .studyos-drag-handle:hover { background: rgba(99,102,241,0.12) !important; }
        .tiptap-prose > * { transition: outline 0.1s; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--paper-bg)" }}>

        {/* ── Editor area ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "40px 56px 80px", position: "relative" }}>
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* ── Slash menu (outside div flow, fixed to viewport) ── */}
      {slashActive && (
        <SlashMenu info={slashInfo} editor={editor} onClose={closeSlash} />
      )}
    </>
  );
}
