"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toHtml } from "hast-util-to-html";
import { toHast } from "mdast-util-to-hast";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Bold,
  Code,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";

const starterMarkdown = `# Split Markdown Editor

Write markdown on the left and preview on the right.

## GFM support
- [x] Task lists
- [x] Tables
- [x] Autolinks

| Feature | Status |
| --- | --- |
| Preview | Live |
| Styling | shadcn/ui |

\`\`\`tsx
export function Hello() {
  return <p>Hello markdown</p>;
}
\`\`\`

> This is rendered through a markdown library, not a manual parser.
`;

const editorThemes = {
  "github-light": {
    label: "GitHub Light",
    card: "border-slate-200 bg-white text-slate-900",
    header: "border-slate-200 bg-slate-100/80",
    footer: "border-slate-200",
    gutter: "border-slate-200 bg-slate-50 text-slate-400",
    title: "text-slate-500",
    toolbarButton:
      "border-slate-300 bg-white text-slate-800 hover:bg-slate-100",
    textarea:
      "bg-white text-slate-900 placeholder:text-slate-400 caret-slate-900 selection:bg-sky-200",
  },
  "github-dark": {
    label: "GitHub Dark",
    card: "border-slate-700 bg-slate-900 text-slate-100",
    header: "border-slate-700 bg-slate-950",
    footer: "border-slate-700",
    gutter: "border-slate-700 bg-slate-950 text-slate-500",
    title: "text-slate-400",
    toolbarButton:
      "border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700",
    textarea:
      "bg-slate-900 text-slate-100 placeholder:text-slate-500 caret-slate-100 selection:bg-slate-700",
  },
  dracula: {
    label: "Dracula",
    card: "border-fuchsia-900/50 bg-[#282a36] text-[#f8f8f2]",
    header: "border-fuchsia-900/40 bg-[#21222c]",
    footer: "border-fuchsia-900/40",
    gutter: "border-fuchsia-900/40 bg-[#21222c] text-[#6272a4]",
    title: "text-[#bd93f9]",
    toolbarButton:
      "border-fuchsia-800/60 bg-[#343746] text-[#f8f8f2] hover:bg-[#44475a]",
    textarea:
      "bg-[#282a36] text-[#f8f8f2] placeholder:text-[#6272a4] caret-[#f8f8f2] selection:bg-[#44475a]",
  },
  monokai: {
    label: "Monokai",
    card: "border-zinc-700 bg-[#272822] text-[#f8f8f2]",
    header: "border-zinc-700 bg-[#1f201c]",
    footer: "border-zinc-700",
    gutter: "border-zinc-700 bg-[#1f201c] text-[#75715e]",
    title: "text-[#a6e22e]",
    toolbarButton:
      "border-zinc-600 bg-[#3e3d32] text-[#f8f8f2] hover:bg-[#575647]",
    textarea:
      "bg-[#272822] text-[#f8f8f2] placeholder:text-[#75715e] caret-[#f8f8f2] selection:bg-[#49483e]",
  },
  "solarized-dark": {
    label: "Solarized Dark",
    card: "border-cyan-900/70 bg-[#002b36] text-[#93a1a1]",
    header: "border-cyan-900/70 bg-[#001f27]",
    footer: "border-cyan-900/70",
    gutter: "border-cyan-900/70 bg-[#001f27] text-[#586e75]",
    title: "text-[#2aa198]",
    toolbarButton:
      "border-cyan-900/80 bg-[#073642] text-[#93a1a1] hover:bg-[#0d4b59]",
    textarea:
      "bg-[#002b36] text-[#93a1a1] placeholder:text-[#586e75] caret-[#93a1a1] selection:bg-[#073642]",
  },
} as const;

type EditorThemeKey = keyof typeof editorThemes;

export default function Home() {
  const [markdown, setMarkdown] = useState(starterMarkdown);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const historyRef = useRef<string[]>([starterMarkdown]);
  const historyIndexRef = useRef(0);
  const [editorTheme, setEditorTheme] = useState<EditorThemeKey>(() => {
    if (typeof window === "undefined") {
      return "github-dark";
    }

    const storedTheme = window.localStorage.getItem("editor-theme");
    if (storedTheme && storedTheme in editorThemes) {
      return storedTheme as EditorThemeKey;
    }

    return "github-dark";
  });

  useEffect(() => {
    window.localStorage.setItem("editor-theme", editorTheme);
  }, [editorTheme]);

  const previewHtml = useMemo(() => {
    const tree = remark().use(remarkParse).use(remarkGfm).parse(markdown);
    return toHtml(toHast(tree));
  }, [markdown]);

  const lineCount = useMemo(() => markdown.split("\n").length, [markdown]);
  const lineNumbers = useMemo(
    () => Array.from({ length: lineCount }, (_, index) => index + 1),
    [lineCount],
  );
  const wordCount = useMemo(() => {
    const words = markdown.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }, [markdown]);

  const activeEditorTheme = editorThemes[editorTheme];

  const applyMarkdownUpdate = (nextValue: string, pushHistory = true) => {
    setMarkdown(nextValue);

    if (!pushHistory) {
      return;
    }

    const history = historyRef.current;
    const currentIndex = historyIndexRef.current;
    const currentValue = history[currentIndex];
    if (nextValue === currentValue) {
      return;
    }

    const nextHistory = history.slice(0, currentIndex + 1);
    nextHistory.push(nextValue);
    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
  };

  const undo = () => {
    if (historyIndexRef.current <= 0) {
      return;
    }

    historyIndexRef.current -= 1;
    applyMarkdownUpdate(historyRef.current[historyIndexRef.current], false);
  };

  const redo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) {
      return;
    }

    historyIndexRef.current += 1;
    applyMarkdownUpdate(historyRef.current[historyIndexRef.current], false);
  };

  const replaceSelection = ({
    before,
    after = "",
    placeholder = "",
  }: {
    before: string;
    after?: string;
    placeholder?: string;
  }) => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selected = markdown.slice(start, end);
    const content = selected || placeholder;
    const nextValue =
      markdown.slice(0, start) + before + content + after + markdown.slice(end);

    applyMarkdownUpdate(nextValue);

    requestAnimationFrame(() => {
      editor.focus();
      const selectionStart = start + before.length;
      const selectionEnd = selectionStart + content.length;
      editor.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const prefixCurrentLine = (prefix: string) => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const start = editor.selectionStart;
    const lineStart = markdown.lastIndexOf("\n", start - 1) + 1;
    const nextValue =
      markdown.slice(0, lineStart) + prefix + markdown.slice(lineStart);
    applyMarkdownUpdate(nextValue);

    requestAnimationFrame(() => {
      editor.focus();
      const nextCursor = start + prefix.length;
      editor.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const applyBold = () =>
    replaceSelection({ before: "**", after: "**", placeholder: "bold text" });
  const applyItalic = () =>
    replaceSelection({ before: "*", after: "*", placeholder: "italic text" });
  const applyInlineCode = () =>
    replaceSelection({ before: "`", after: "`", placeholder: "code" });
  const applyLink = () =>
    replaceSelection({
      before: "[",
      after: "](https://example.com)",
      placeholder: "link text",
    });
  const applyHeading = () => prefixCurrentLine("## ");
  const applyQuote = () => prefixCurrentLine("> ");
  const applyBulletList = () => prefixCurrentLine("- ");
  const applyOrderedList = () => prefixCurrentLine("1. ");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,#d8f4e9_0%,transparent_35%),radial-gradient(circle_at_left_bottom,#f4dfbf_0%,transparent_30%),oklch(0.98_0.01_90)] p-4 dark:bg-[radial-gradient(circle_at_top_right,#1d3b32_0%,transparent_38%),radial-gradient(circle_at_left_bottom,#3d2f1c_0%,transparent_34%),oklch(0.19_0.01_240)]">
      <section className="mx-auto w-full">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            Markdown Editor
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Split View</Badge>
            <label className="inline-flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Editor Theme
              </span>
              <select
                value={editorTheme}
                onChange={(event) =>
                  setEditorTheme(event.target.value as EditorThemeKey)
                }
                className="h-8 rounded-md border border-border bg-card px-2 text-xs text-foreground shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-label="Select editor theme"
              >
                {Object.entries(editorThemes).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>

        <div className="w-full min-h-screen">
          <ResizablePanelGroup>
            <ResizablePanel>
              <Card
                className={cn(
                  "gap-0 h-full rounded-sm relative",
                  activeEditorTheme.card,
                )}
              >
                <CardHeader
                  className={cn("border-b", activeEditorTheme.header)}
                >
                  <CardTitle
                    className={cn(
                      "text-sm font-medium uppercase tracking-[0.12em]",
                      activeEditorTheme.title,
                    )}
                  >
                    Editor
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={applyBold}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
                        activeEditorTheme.toolbarButton,
                      )}
                      aria-label="Bold"
                      title="Bold"
                    >
                      <Bold className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={applyItalic}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
                        activeEditorTheme.toolbarButton,
                      )}
                      aria-label="Italic"
                      title="Italic"
                    >
                      <Italic className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={applyInlineCode}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
                        activeEditorTheme.toolbarButton,
                      )}
                      aria-label="Inline code"
                      title="Inline code"
                    >
                      <Code className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={applyLink}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
                        activeEditorTheme.toolbarButton,
                      )}
                      aria-label="Link"
                      title="Link"
                    >
                      <Link2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={applyHeading}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
                        activeEditorTheme.toolbarButton,
                      )}
                      aria-label="Heading"
                      title="Heading"
                    >
                      <Heading2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={applyQuote}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
                        activeEditorTheme.toolbarButton,
                      )}
                      aria-label="Quote"
                      title="Quote"
                    >
                      <Quote className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={applyBulletList}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
                        activeEditorTheme.toolbarButton,
                      )}
                      aria-label="Bullet list"
                      title="Bullet list"
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={applyOrderedList}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
                        activeEditorTheme.toolbarButton,
                      )}
                      aria-label="Ordered list"
                      title="Ordered list"
                    >
                      <ListOrdered className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative min-h-[65vh]">
                    <div
                      ref={gutterRef}
                      className={cn(
                        "absolute inset-y-0 left-0 w-12 overflow-hidden border-r px-2 py-2 text-right font-mono text-xs leading-6 select-none",
                        activeEditorTheme.gutter,
                      )}
                      aria-hidden="true"
                    >
                      {lineNumbers.map((line) => (
                        <div key={line}>{line}</div>
                      ))}
                    </div>
                    <Textarea
                      ref={editorRef}
                      className={cn(
                        "min-h-[65vh] resize-none rounded-none border-0 pl-14 font-mono text-sm leading-6 shadow-none focus-visible:ring-0",
                        activeEditorTheme.textarea,
                      )}
                      value={markdown}
                      onChange={(event) =>
                        applyMarkdownUpdate(event.target.value)
                      }
                      onScroll={(event) => {
                        if (gutterRef.current) {
                          gutterRef.current.scrollTop = event.currentTarget.scrollTop;
                        }
                      }}
                      onKeyDown={(event) => {
                        const isShortcut = event.ctrlKey || event.metaKey;
                        if (!isShortcut || event.key.toLowerCase() !== "z") {
                          return;
                        }

                        event.preventDefault();
                        if (event.shiftKey) {
                          redo();
                          return;
                        }

                        undo();
                      }}
                      spellCheck={false}
                      aria-label="Markdown editor input"
                    />
                  </div>
                </CardContent>
                <CardFooter
                  className={cn(
                    "border-t px-4 py-2 text-xs",
                    activeEditorTheme.footer,
                    activeEditorTheme.title,
                  )}
                >
                  <span>Lines: {lineCount}</span>
                  <span className="ml-4">Words: {wordCount}</span>
                </CardFooter>
              </Card>
            </ResizablePanel>
            <ResizableHandle />

            <ResizablePanel>
              <Card className="gap-0 h-full rounded-sm">
                <CardHeader className="border-b">
                  <CardTitle className="text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="min-h-[65vh] overflow-auto p-5">
                  <article
                    className="markdown-content"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </CardContent>
              </Card>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </section>
    </main>
  );
}
