import { createPrisma, findPostById, findAllPosts } from "@repo/db";
import { MarkdownRenderer } from "@repo/markdown";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  // Skip database operations during build if DATABASE_URL is not available
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not found during build, using fallback static params');
    return [{ id: 'fallback' }];
  }
  
  try {
    const prisma = createPrisma(process.env.DATABASE_URL!);
    const getAllPosts = findAllPosts(prisma);
    
    const result = await getAllPosts();
    
    if (result.isErr()) {
      console.warn('Failed to get posts, using fallback static params');
      return [{ id: 'fallback' }];
    }
    
    return result.value.map((post) => ({ id: post.id }));
  } catch (error) {
    console.warn('Failed to generate static params:', error);
    return [{ id: 'fallback' }];
  }
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  
  // Skip database operations during build if DATABASE_URL is not available
  if (!process.env.DATABASE_URL) {
    return (
      <div className="mx-auto max-w-4xl">
        <div>DATABASE_URLが設定されていません。記事を表示するにはデータベース接続が必要です。</div>
      </div>
    );
  }
  
  try {
    const prisma = createPrisma(process.env.DATABASE_URL!);
    const getPost = findPostById(prisma);
    const result = await getPost(id);
    
    if (result.isErr()) {
      return <div>記事の読み込みでエラーが発生しました</div>;
    }
    
    const post = result.value;
    
    if (!post) {
      return <div>記事が見つかりません</div>;
    }

    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
          <div className="flex gap-2 mb-4 justify-center">
            {post.tags.map((tag) => (
              <span key={tag.id} className="bg-gray-200 px-2 py-1 rounded text-sm">
                {tag.name}
              </span>
            ))}
          </div>
          <div className="text-gray-600 text-sm">
            {new Date(post.createdAt).toLocaleDateString('ja-JP')}
          </div>
        </div>
        <MarkdownRenderer content={post.content} />
      </div>
    );
  } catch (error) {
    console.error('Failed to load post:', error);
    return <div>記事の読み込みでエラーが発生しました</div>;
  }
}
