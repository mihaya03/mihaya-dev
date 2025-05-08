import { createPrisma, findAllPosts } from "@repo/db";
import Link from "next/link";

export default async function PostsPage() {
  // Skip database operations during build if DATABASE_URL is not available
  if (!process.env.DATABASE_URL) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">記事一覧</h1>
        <div>
          DATABASE_URLが設定されていません。記事を表示するにはデータベース接続が必要です。
        </div>
      </div>
    );
  }

  try {
    const prisma = createPrisma(process.env.DATABASE_URL!);
    const getAllPosts = findAllPosts(prisma);

    const result = await getAllPosts();

    if (result.isErr()) {
      console.error("Database error:", result.error);
      return (
        <div>記事の読み込みでエラーが発生しました: {result.error.message}</div>
      );
    }

    const posts = result.value;

    return (
      <div className="w-full px-8 sm:px-12 lg:px-16">
        <div>
          {posts.map((post, index) => (
            <div
              key={post.id}
              className={`${index === 0 ? "border-t" : ""} border-b border-gray-600 py-6 pl-2 hover:bg-gray-50 transition-colors`}
            >
              <div className="text-sm text-gray-500 mb-2">
                {new Date(post.createdAt)
                  .toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })
                  .replace(/\//g, "-")}
              </div>
              <Link href={`/posts/${post.id}`} prefetch={true}>
                <h2 className="text-xl font-semibold mb-2 text-gray-600 hover:text-gray-800">
                  {post.title}
                </h2>
              </Link>
              <div className="flex gap-2 mb-3">
                {post.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="bg-gray-200 px-2 py-1 rounded text-sm"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return <div>予期しないエラーが発生しました</div>;
  }
}
