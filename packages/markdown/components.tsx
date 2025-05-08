import React from "react";
import Image from "next/image";
import Link from "next/link";

const MarkdownH1 = (props: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h1 className="text-2xl font-bold mb-4 !bg-red-500" {...props} />
);

const MarkdownH2 = (props: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className="" {...props} />
);

const MarkdownH3 = (props: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className="" {...props} />
);

const MarkdownH4 = (props: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h4 className="" {...props} />
);

const MarkdownH5 = (props: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h5 className="" {...props} />
);

const MarkdownH6 = (props: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h6 className="" {...props} />
);

const MarkdownP = (props: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className="" {...props} />
);

const MarkdownUl: React.FC<React.HTMLAttributes<HTMLUListElement>> = ({
  children,
  className,
  ...props
}) => (
  <ul className={className} {...props}>
    {children}
  </ul>
);

const MarkdownOl: React.FC<React.HTMLAttributes<HTMLOListElement>> = ({
  children,
  className,
  ...props
}) => (
  <ol className={className} {...props}>
    {children}
  </ol>
);

const MarkdownLi: React.FC<React.HTMLAttributes<HTMLLIElement>> = ({
  children,
  className,
  ...props
}) => (
  <li className={className} {...props}>
    {children}
  </li>
);

const MarkdownA = (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const { href = "", children, ...rest } = props;
  const isExternal = href.startsWith("http");
  if (isExternal) {
    return (
      <a target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href}>
      <a {...rest}>{children}</a>
    </Link>
  );
};

const MarkdownImg = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const { src = "", alt = "", width: w, height: h, className, ...rest } = props;
  const width = typeof w === "string" ? parseInt(w, 10) : w;
  const height = typeof h === "string" ? parseInt(h, 10) : h;
  const srcVal = typeof src === "string" ? src : "";
  return (
    <Image
      className={className}
      src={srcVal}
      alt={alt}
      width={width}
      height={height}
      {...rest}
    />
  );
};

const MarkdownBlockquote = (props: React.HTMLAttributes<HTMLElement>) => (
  <blockquote className="" {...props} />
);

const MarkdownCode = (
  props: React.HTMLAttributes<HTMLElement> & {
    "data-rehype-pretty-code-fragment"?: any;
  },
) => {
  const { className, children, ...rest } = props;

  // コードブロック内の<code>要素かどうかをより確実に判定
  // 1. <span class="line">要素を含んでいる場合（Shikiの特徴）
  // 2. 親要素が<pre>の場合（rehype-pretty-codeなどの特徴）
  const hasLineSpans =
    typeof children === "object" &&
    React.Children.toArray(children).some(
      (child) =>
        React.isValidElement(child) &&
        (child.props as any)?.className?.includes("line"),
    );

  const isCodeBlock =
    hasLineSpans ||
    (className &&
      (className.startsWith("language-") || className.includes("shiki")));

  if (isCodeBlock) {
    // コードブロック用の<code /> - スタイルを一切適用しない
    return (
      <code className={className} {...rest}>
        {children}
      </code>
    );
  } else {
    // インラインコード用の<code />
    const inlineCodeStyle =
      "bg-gray-100 dark:bg-gray-700 text-red-500 dark:text-red-400 px-1 py-0.5 rounded-sm text-sm";
    const combinedClassName = className
      ? `${inlineCodeStyle} ${className}`
      : inlineCodeStyle;
    return (
      <code className={combinedClassName} {...rest}>
        {children}
      </code>
    );
  }
};
const MarkdownPre = (props: React.HTMLAttributes<HTMLPreElement>) => {
  const { style, ...rest } = props;
  return (
    <pre
      className="!bg-gray-100 dark:!bg-gray-800 p-4 rounded-md overflow-x-auto"
      style={
        {
          ...style,
          backgroundColor: "rgb(243 244 246)", // bg-gray-100相当
          "--shiki-light-bg": "rgb(243 244 246)",
          "--shiki-dark-bg": "rgb(31 41 55)", // bg-gray-800相当
        } as React.CSSProperties
      }
      {...rest}
    />
  );
};

const MarkdownHr = (props: React.HTMLAttributes<HTMLHRElement>) => (
  <hr className="" {...props} />
);

const MarkdownTable = (props: React.HTMLAttributes<HTMLTableElement>) => (
  <table className="" {...props} />
);

const MarkdownThead = (
  props: React.HTMLAttributes<HTMLTableSectionElement>,
) => <thead className="" {...props} />;

const MarkdownTbody = (
  props: React.HTMLAttributes<HTMLTableSectionElement>,
) => <tbody {...props} />;

const MarkdownTr = (props: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className="" {...props} />
);

const MarkdownTh = (props: React.HTMLAttributes<HTMLTableCellElement>) => (
  <th className="" {...props} />
);

const MarkdownTd = (props: React.HTMLAttributes<HTMLTableCellElement>) => (
  <td className="" {...props} />
);

const MarkdownEm = (props: React.HTMLAttributes<HTMLElement>) => (
  <em className="" {...props} />
);

const MarkdownStrong = (props: React.HTMLAttributes<HTMLElement>) => (
  <strong className="" {...props} />
);

const MarkdownDel = (props: React.HTMLAttributes<HTMLElement>) => (
  <del className="" {...props} />
);

export {
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
};
