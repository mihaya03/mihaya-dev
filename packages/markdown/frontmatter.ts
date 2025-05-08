export interface Frontmatter {
  title: string;
  tags?: string[];
  [key: string]: any;
}

export interface ParsedMarkdown {
  frontmatter: Frontmatter;
  content: string;
}

export function parseFrontmatter(markdown: string): ParsedMarkdown {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (!match || !match[1] || !match[2]) {
    throw new Error("Invalid markdown format: frontmatter not found");
  }

  const frontmatterText = match[1];
  const content = match[2].trim();

  const frontmatter: Frontmatter = { title: "" };

  const lines = frontmatterText.split("\n");
  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    if (!key || !value) continue;

    if (key === "title") {
      frontmatter.title = value.replace(/^["']|["']$/g, "");
    } else if (key === "tags") {
      if (value.startsWith("[") && value.endsWith("]")) {
        frontmatter.tags = value
          .slice(1, -1)
          .split(",")
          .map((tag) => tag.trim().replace(/^["']|["']$/g, ""))
          .filter((tag) => tag.length > 0);
      }
    } else {
      let parsedValue: any = value.replace(/^["']|["']$/g, "");

      if (parsedValue === "true") parsedValue = true;
      else if (parsedValue === "false") parsedValue = false;
      else if (!isNaN(Number(parsedValue)) && parsedValue !== "") {
        parsedValue = Number(parsedValue);
      }

      frontmatter[key] = parsedValue;
    }
  }

  if (!frontmatter.title) {
    throw new Error("Title is required in frontmatter");
  }

  return { frontmatter, content };
}
