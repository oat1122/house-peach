'use client';

import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import CodeMirror, {
  EditorView,
  type ReactCodeMirrorRef,
} from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { useTheme } from 'next-themes';
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  Quote,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  MediaPicker,
  type PickerAsset,
} from '@/components/admin/media/MediaPicker';

type Props = {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  /** Accessible name when no associated <label> exists. */
  ariaLabel?: string;
  /** Allow the toolbar to open the media library when inserting an image. */
  libraryAssets?: PickerAsset[];
  /** Minimum visible height of the editor area. Default ~500px. */
  minHeight?: string;
};

/**
 * MDX editor for the admin post + work flow. Wraps CodeMirror 6 with a
 * markdown lexer, line wrapping, and a thin toolbar that dispatches markdown
 * snippets. Image insertion goes through MediaPicker so admins can pick from
 * the existing library without leaving the editor.
 *
 * Theme: switches to `oneDark` when next-themes resolves to `ink` (the only
 * dark preset in the project). All other presets use the default light theme
 * which inherits its surface colour from our card token.
 */
export function MdxEditor({
  id,
  value,
  onChange,
  ariaLabel,
  libraryAssets = [],
  minHeight = '480px',
}: Props) {
  const editorRef = useRef<ReactCodeMirrorRef | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { resolvedTheme } = useTheme();

  // next-themes returns undefined on the server; gate the theme decision until
  // after hydration to keep SSR markup consistent with the first client render.
  // useSyncExternalStore with a no-op subscriber is the lint-compliant
  // equivalent of `useEffect(() => setMounted(true), [])`.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === 'ink';

  /** Replace the current selection (or insert at cursor if empty selection). */
  const replaceSelection = useCallback((text: string) => {
    const view = editorRef.current?.view;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length },
    });
    view.focus();
  }, []);

  /** Wrap the current selection with `before` and `after`; if empty, insert
   *  both and place caret between them. */
  const wrapSelection = useCallback((before: string, after = before) => {
    const view = editorRef.current?.view;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to);
    const insert = `${before}${selected}${after}`;
    view.dispatch({
      changes: { from, to, insert },
      selection: {
        anchor: from + before.length + selected.length + (selected ? 0 : 0),
      },
    });
    view.focus();
  }, []);

  /** Prepend `prefix` to every line in the current selection (or the line at
   *  the caret if nothing is selected). */
  const prefixLines = useCallback((prefix: string) => {
    const view = editorRef.current?.view;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const startLine = view.state.doc.lineAt(from);
    const endLine = view.state.doc.lineAt(to);
    const changes = [];
    for (let n = startLine.number; n <= endLine.number; n++) {
      const line = view.state.doc.line(n);
      changes.push({ from: line.from, to: line.from, insert: prefix });
    }
    view.dispatch({ changes });
    view.focus();
  }, []);

  const handlePickImage = useCallback(
    (asset: PickerAsset) => {
      // Escape every character that could break out of a JSX attribute value
      // (backslash → escape itself first; double-quote → close quote; newline
      // → JSX literal newline inside an attribute is a parse error). Without
      // this an asset whose alt/title contains `/>` or a newline could inject
      // additional attributes (e.g. onError) past the MDX whitelist.
      const escapeAttr = (s: string) =>
        s
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/[\r\n]+/g, ' ')
          .trim();
      const altSafe = escapeAttr(asset.alt || asset.title || 'image');
      const srcSafe = escapeAttr(asset.path);
      replaceSelection(`\n<MDXImage src="${srcSafe}" alt="${altSafe}" />\n`);
      setPickerOpen(false);
    },
    [replaceSelection],
  );

  const insertLink = useCallback(() => {
    const view = editorRef.current?.view;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to) || 'ข้อความ';
    const insert = `[${selected}](https://)`;
    view.dispatch({
      changes: { from, to, insert },
      // Place caret on the `https://` so the admin can type the URL immediately.
      selection: { anchor: from + selected.length + 3, head: from + insert.length - 1 },
    });
    view.focus();
  }, []);

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <div
        className="flex flex-wrap items-center gap-1 border-b border-border bg-bg2/40 px-2 py-1.5"
        role="toolbar"
        aria-label="ตัวช่วยจัดรูปแบบ MDX"
      >
        <ToolbarButton onClick={() => prefixLines('## ')} title="หัวข้อ H2">
          <Heading2 className="size-4" aria-hidden />
          <span className="sr-only">H2</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => prefixLines('### ')} title="หัวข้อ H3">
          <Heading3 className="size-4" aria-hidden />
          <span className="sr-only">H3</span>
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => wrapSelection('**')} title="ตัวหนา (Ctrl+B)">
          <Bold className="size-4" aria-hidden />
          <span className="sr-only">Bold</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => wrapSelection('*')} title="ตัวเอียง (Ctrl+I)">
          <Italic className="size-4" aria-hidden />
          <span className="sr-only">Italic</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => wrapSelection('`')} title="โค้ดอินไลน์">
          <Code className="size-4" aria-hidden />
          <span className="sr-only">Code</span>
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={insertLink} title="ลิงก์">
          <LinkIcon className="size-4" aria-hidden />
          <span className="sr-only">Link</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => prefixLines('- ')} title="รายการ">
          <List className="size-4" aria-hidden />
          <span className="sr-only">List</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => prefixLines('> ')} title="ข้อความอ้างอิง">
          <Quote className="size-4" aria-hidden />
          <span className="sr-only">Quote</span>
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          onClick={() => setPickerOpen(true)}
          title="แทรกรูปจากคลัง"
          disabled={libraryAssets.length === 0}
        >
          <ImageIcon className="size-4" aria-hidden />
          <span className="sr-only">Insert image</span>
        </ToolbarButton>
      </div>

      <CodeMirror
        ref={editorRef}
        value={value}
        onChange={onChange}
        theme={isDark ? oneDark : 'light'}
        extensions={[markdown(), EditorView.lineWrapping]}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: true,
          highlightActiveLineGutter: false,
          autocompletion: false,
          searchKeymap: false,
        }}
        minHeight={minHeight}
        aria-label={ariaLabel ?? 'MDX editor'}
        id={id}
        style={{ fontSize: '14px' }}
      />

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
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className="h-7 w-7 p-0"
    >
      {children}
    </Button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-0.5 h-5 w-px bg-border" />;
}
