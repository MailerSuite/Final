"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import { useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Code,
  Type,
  Palette,
  Link,
  ImageIcon,
  Undo,
  Redo,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  value: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      LinkExtension.configure({
        autolink: true,
        linkOnPaste: true,
        openOnClick: false,
      }),
    ],
    content: value,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert max-w-none focus:outline-none",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "Email body",
      },
    },
  });

  // Sync value on external change
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false); // false to prevent setting selection
    }
  }, [value, editor]);

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-border dark:border-border rounded-md">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-muted border-b rounded-t-md">
        <Select
          value={
            editor.isActive("heading", { level: 1 })
              ? "heading1"
              : editor.isActive("heading", { level: 2 })
              ? "heading2"
              : editor.isActive("heading", { level: 3 })
              ? "heading3"
              : editor.isActive("heading", { level: 4 })
              ? "heading4"
              : editor.isActive("heading", { level: 5 })
              ? "heading5"
              : editor.isActive("heading", { level: 6 })
              ? "heading6"
              : "paragraph"
          }
          onValueChange={(val) => {
            if (val === "paragraph") {
              editor.chain().focus().setParagraph().run();
            } else if (val.startsWith("heading")) {
              const level = Number.parseInt(val.replace("heading", "")) as 1 | 2 | 3 | 4 | 5 | 6;
              editor.chain().focus().toggleHeading({ level }).run();
            }
          }}
        >
          <SelectTrigger className="w-20 sm:w-24 h-8 bg-background border-border dark:border-border text-xs">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paragraph">Normal</SelectItem>
            <SelectItem value="heading1">H1</SelectItem>
            <SelectItem value="heading2">H2</SelectItem>
            <SelectItem value="heading3">H3</SelectItem>
            <SelectItem value="heading4">H4</SelectItem>
            <SelectItem value="heading5">H5</SelectItem>
            <SelectItem value="heading6">H6</SelectItem>
          </SelectContent>
        </Select>
        <div className="h-6 w-px bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().toggleBold()}
          className={
            editor.isActive("bold") ? "bg-accent text-accent-foreground" : ""
          }
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().toggleItalic()}
          className={
            editor.isActive("italic") ? "bg-accent text-accent-foreground" : ""
          }
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().toggleUnderline()}
          className={
            editor.isActive("underline")
              ? "bg-accent text-accent-foreground"
              : ""
          }
        >
          <Underline className="h-4 w-4" />
        </Button>
        {/* <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().toggleStrike()}
          className={
            editor.isActive("strike") ? "bg-accent text-accent-foreground" : ""
          }
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <div className="h-6 w-px bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={!editor.can().toggleBulletList()}
          className={
            editor.isActive("bulletList")
              ? "bg-accent text-accent-foreground"
              : ""
          }
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={!editor.can().toggleOrderedList()}
          className={
            editor.isActive("orderedList")
              ? "bg-accent text-accent-foreground"
              : ""
          }
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          disabled={!editor.can().toggleCodeBlock()}
          className={
            editor.isActive("codeBlock")
              ? "bg-accent text-accent-foreground"
              : ""
          }
        >
          <Code className="h-4 w-4" />
        </Button>
        <div className="h-6 w-px bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={setLink}
          disabled={!editor.can().setLink({href: ""})}
          className={
            editor.isActive("link") ? "bg-accent text-accent-foreground" : ""
          }
        >
          <Link className="h-4 w-4" />
        </Button> */}
        {editor.isActive("link") && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().unsetLink().run()}
            aria-label="Remove link"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {/* Placeholder buttons for future extensions */}
        {/* <Button type="button" variant="ghost" size="icon" disabled>
          <Type className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" disabled>
          <Palette className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" disabled>
          <ImageIcon className="h-4 w-4" />
        </Button> */}
        <div className="h-6 w-px bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      {/* Editor Area */}
      <EditorContent
        editor={editor}
        className="min-h-[200px] p-3 bg-border outline-none"
      />
    </div>
  );
}
