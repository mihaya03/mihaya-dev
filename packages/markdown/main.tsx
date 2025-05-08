import { remark } from "remark";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeReact from "rehype-react";
import remarkGfm from "remark-gfm";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import rehypeShiki from "@shikijs/rehype";
import {
  MarkdownH1,
  MarkdownH2,
  MarkdownH3,
  MarkdownH4,
  MarkdownH5,
  MarkdownH6,
  MarkdownP,
  MarkdownUl,
  MarkdownOl,
  MarkdownLi,
  MarkdownA,
  MarkdownImg,
  MarkdownBlockquote,
  MarkdownCode,
  MarkdownPre,
  MarkdownHr,
  MarkdownTable,
  MarkdownThead,
  MarkdownTbody,
  MarkdownTr,
  MarkdownTh,
  MarkdownTd,
  MarkdownEm,
  MarkdownStrong,
  MarkdownDel,
} from "./components";
import fs from "fs/promises";
import path from "path";

async function markdownToReact(markdown: string) {
  const file = await remark()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeShiki, {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
    })
    .use(rehypeReact, {
      jsx,
      jsxs,
      Fragment,
      components: {
        h1: MarkdownH1,
        h2: MarkdownH2,
        h3: MarkdownH3,
        h4: MarkdownH4,
        h5: MarkdownH5,
        h6: MarkdownH6,
        p: MarkdownP,
        ul: MarkdownUl,
        ol: MarkdownOl,
        li: MarkdownLi,
        a: MarkdownA,
        img: MarkdownImg,
        blockquote: MarkdownBlockquote,
        code: MarkdownCode,
        pre: MarkdownPre,
        hr: MarkdownHr,
        table: MarkdownTable,
        thead: MarkdownThead,
        tbody: MarkdownTbody,
        tr: MarkdownTr,
        th: MarkdownTh,
        td: MarkdownTd,
        em: MarkdownEm,
        strong: MarkdownStrong,
        del: MarkdownDel,
      },
    })
    .process(markdown);

  return file.result;
}

type Props = { filePath: string };

const MarkdownRendererFromFile = async ({ filePath }: Props) => {
  const absPath = path.join(process.cwd(), "public", filePath);
  const md = await fs.readFile(absPath, "utf-8");
  const content = await markdownToReact(md);

  return <div className="prose prose-slate">{content}</div>;
};

type MarkdownRendererProps = { content: string };

const MarkdownRenderer = async ({ content }: MarkdownRendererProps) => {
  const renderedContent = await markdownToReact(content);
  return <div className="prose prose-slate">{renderedContent}</div>;
};

export { markdownToReact, MarkdownRendererFromFile, MarkdownRenderer };
