"use client";

import { useEffect, useMemo, useState } from "react";
import { toHtml } from "hast-util-to-html";
import { toHast } from "mdast-util-to-hast";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

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

export default function Home() {
  const [markdown, setMarkdown] = useState(starterMarkdown);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const storedTheme = window.localStorage.getItem("theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    return prefersDark ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const previewHtml = useMemo(() => {
    const tree = remark().use(remarkParse).use(remarkGfm).parse(markdown);
    return toHtml(toHast(tree));
  }, [markdown]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,#d8f4e9_0%,transparent_35%),radial-gradient(circle_at_left_bottom,#f4dfbf_0%,transparent_30%),oklch(0.98_0.01_90)] p-4 dark:bg-[radial-gradient(circle_at_top_right,#1d3b32_0%,transparent_38%),radial-gradient(circle_at_left_bottom,#3d2f1c_0%,transparent_34%),oklch(0.19_0.01_240)]">
      <section className="mx-auto w-full">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            Markdown Editor
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Split View</Badge>
            <button
              type="button"
              onClick={() =>
                setTheme((current) => (current === "dark" ? "light" : "dark"))
              }
              className="inline-flex h-8 items-center rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>
          </div>
        </header>

        <div className="w-full">
          <ResizablePanelGroup>
            <ResizablePanel>
              <Card className="gap-0 min-h-screen rounded-sm">
                <CardHeader className="border-b">
                  <CardTitle className="text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Editor
                  </CardTitle>
                  <div>Buttons here</div>
                </CardHeader>
                <CardContent className="p-0">
                  <Textarea
                    className="min-h-[65vh] resize-none rounded-none border-0 font-mono text-sm shadow-none focus-visible:ring-0"
                    value={markdown}
                    onChange={(event) => setMarkdown(event.target.value)}
                    spellCheck={false}
                    aria-label="Markdown editor input"
                  />
                </CardContent>
              </Card>
            </ResizablePanel>
            <ResizableHandle />

            <ResizablePanel>
              <Card className="gap-0 min-h-screen rounded-sm">
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
