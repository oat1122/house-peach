'use client';

import { useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MediaPicker,
  type PickerAsset,
} from '@/components/admin/media/MediaPicker';
import { EMPTY_TIPTAP_DOC, parseTiptapDoc } from '@/lib/tiptap/text';

type Props = {
  id?: string;
  /** Tiptap JSON doc string. */
  value: string;
  onChange: (next: string) => void;
  ariaLabel?: string;
  /** Allow the toolbar to insert an image from the existing media library. */
  libraryAssets?: PickerAsset[];
};

/**
 * WYSIWYG content editor for posts + works. Wraps Tiptap (ProseMirror) and
 * emits the document as a JSON string so non-dev clients never touch markup.
 *
 * - StarterKit gives bold/italic/strike/code, lists, blockquote, headings.
 *   Headings are capped to H2/H3 (the page owns the single H1); code blocks +
 *   horizontal rules are disabled to keep the surface simple.
 * - Image insertion goes through MediaPicker (same flow the old MDX editor used).
 * - The editor body carries the `prose-post` class so it renders with the same
 *   typography the public page uses — true WYSIWYG across all 4 themes.
 */
export function TiptapEditor({
  id,
  value,
  onChange,
  ariaLabel,
  libraryAssets = [],
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const editor = useEditor({
    immediatelyRender: false, // required under Next SSR to avoid hydration drift
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: true },
      }),
      Image.configure({ allowBase64: false }),
    ],
    content: parseTiptapDoc(value) ?? JSON.parse(EMPTY_TIPTAP_DOC),
    editorProps: {
      attributes: {
        class:
          'prose-post min-h-[420px] max-w-none px-4 py-3 focus:outline-none',
        ...(id ? { id } : {}),
        'aria-label': ariaLabel ?? 'ตัวแก้ไขเนื้อหา',
      },
    },
    onUpdate: ({ editor }) => onChange(JSON.stringify(editor.getJSON())),
  });

  const handlePickImage = useCallback(
    (asset: PickerAsset) => {
      editor
        ?.chain()
        .focus()
        .setImage({ src: asset.path, alt: asset.alt || asset.title || 'image' })
        .run();
      setPickerOpen(false);
    },
    [editor],
  );

  const applyLink = useCallback(() => {
    const url = linkUrl.trim();
    if (!editor) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run();
    }
    setLinkOpen(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  if (!editor) {
    return (
      <div className="min-h-[420px] rounded-md border border-border bg-card" />
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <div
        className="flex flex-wrap items-center gap-1 border-b border-border bg-bg2/40 px-2 py-1.5"
        role="toolbar"
        aria-label="ตัวช่วยจัดรูปแบบเนื้อหา"
      >
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="หัวข้อ H2"
        >
          <Heading2 className="size-4" aria-hidden />
          <span className="sr-only">H2</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="หัวข้อ H3"
        >
          <Heading3 className="size-4" aria-hidden />
          <span className="sr-only">H3</span>
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="ตัวหนา"
        >
          <Bold className="size-4" aria-hidden />
          <span className="sr-only">Bold</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="ตัวเอียง"
        >
          <Italic className="size-4" aria-hidden />
          <span className="sr-only">Italic</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title="โค้ดอินไลน์"
        >
          <Code className="size-4" aria-hidden />
          <span className="sr-only">Code</span>
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="รายการแบบจุด"
        >
          <List className="size-4" aria-hidden />
          <span className="sr-only">Bullet list</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="รายการแบบลำดับ"
        >
          <ListOrdered className="size-4" aria-hidden />
          <span className="sr-only">Ordered list</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="ข้อความอ้างอิง"
        >
          <Quote className="size-4" aria-hidden />
          <span className="sr-only">Quote</span>
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          onClick={() => {
            setLinkUrl(editor.getAttributes('link').href ?? '');
            setLinkOpen((v) => !v);
          }}
          active={editor.isActive('link')}
          title="ลิงก์"
        >
          <LinkIcon className="size-4" aria-hidden />
          <span className="sr-only">Link</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setPickerOpen(true)}
          title="แทรกรูปจากคลัง"
          disabled={libraryAssets.length === 0}
        >
          <ImageIcon className="size-4" aria-hidden />
          <span className="sr-only">Insert image</span>
        </ToolbarButton>
      </div>

      {linkOpen && (
        <div className="flex items-center gap-2 border-b border-border bg-bg2/20 px-2 py-1.5">
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyLink();
              }
            }}
            placeholder="https://… (เว้นว่างเพื่อลบลิงก์)"
            aria-label="URL ของลิงก์"
            className="h-8 text-xs"
          />
          <Button type="button" size="sm" onClick={applyLink}>
            ใส่
          </Button>
        </div>
      )}

      <EditorContent editor={editor} />

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        mode="assets"
        assets={libraryAssets}
        pairs={[]}
        selection="single"
        onPick={(result) => {
          if (result.kind !== 'assets' || result.ids.length === 0) return;
          const asset = libraryAssets.find((a) => a.id === result.ids[0]);
          if (asset) handlePickImage(asset);
        }}
      />
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  title,
  active,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className="h-7 w-7 p-0"
    >
      {children}
    </Button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-0.5 h-5 w-px bg-border" />;
}
