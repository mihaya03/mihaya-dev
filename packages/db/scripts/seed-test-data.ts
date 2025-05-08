import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting test data seeding...");

  // 既存データをクリア
  await prisma.$transaction([
    prisma.post.deleteMany(),
    prisma.tag.deleteMany(),
  ]);

  console.log("Existing data cleared.");

  // タグデータの挿入
  const tags = await prisma.$transaction([
    prisma.tag.create({ data: { name: "TypeScript" } }),
    prisma.tag.create({ data: { name: "JavaScript" } }),
    prisma.tag.create({ data: { name: "React" } }),
    prisma.tag.create({ data: { name: "Next.js" } }),
    prisma.tag.create({ data: { name: "Prisma" } }),
    prisma.tag.create({ data: { name: "TiDB" } }),
    prisma.tag.create({ data: { name: "Node.js" } }),
    prisma.tag.create({ data: { name: "GitHub Actions" } }),
    prisma.tag.create({ data: { name: "Cloudflare" } }),
    prisma.tag.create({ data: { name: "テスト" } }),
  ]);

  console.log("Tags created:", tags.length);

  // 投稿データの挿入（タグとの関連付けも同時に実行）
  const posts = await prisma.$transaction([
    prisma.post.create({
      data: {
        title: "TypeScriptの型安全性について",
        content:
          "TypeScriptは静的型付けにより、開発時にエラーを検出できる優れた言語です。特にプロジェクトが大きくなるにつれて、その恩恵を感じることができます。",
        createdAt: new Date("2024-01-15T10:30:00"),
        updatedAt: new Date("2024-01-15T10:30:00"),
        tags: {
          connect: [{ name: "TypeScript" }, { name: "Node.js" }],
        },
      },
    }),
    prisma.post.create({
      data: {
        title: "Reactフックの活用方法",
        content:
          "Reactフックを使用することで、関数コンポーネントでも状態管理やライフサイクルメソッドを使用できます。useStateやuseEffectなどの基本的なフックから始めましょう。",
        createdAt: new Date("2024-01-16T14:20:00"),
        updatedAt: new Date("2024-01-16T14:20:00"),
        tags: {
          connect: [
            { name: "JavaScript" },
            { name: "React" },
            { name: "TypeScript" },
          ],
        },
      },
    }),
    prisma.post.create({
      data: {
        title: "Next.jsのSSRとSSGの違い",
        content:
          "Next.jsではSSR（Server Side Rendering）とSSG（Static Site Generation）を使い分けることができます。それぞれの特徴とユースケースを理解しましょう。",
        createdAt: new Date("2024-01-17T09:15:00"),
        updatedAt: new Date("2024-01-17T09:15:00"),
        tags: {
          connect: [
            { name: "Next.js" },
            { name: "React" },
            { name: "TypeScript" },
          ],
        },
      },
    }),
    prisma.post.create({
      data: {
        title: "Prismaを使ったデータベース操作",
        content:
          "PrismaはTypeScript/JavaScriptのためのモダンなORMです。型安全なデータベース操作と優れた開発体験を提供します。",
        createdAt: new Date("2024-01-18T16:45:00"),
        updatedAt: new Date("2024-01-18T16:45:00"),
        tags: {
          connect: [
            { name: "Prisma" },
            { name: "TiDB" },
            { name: "TypeScript" },
          ],
        },
      },
    }),
    prisma.post.create({
      data: {
        title: "GitHub Actionsによる自動化",
        content:
          "GitHub ActionsでCI/CDパイプラインを構築することで、テストやデプロイを自動化できます。ワークフローの設定方法を学びましょう。",
        createdAt: new Date("2024-01-19T11:30:00"),
        updatedAt: new Date("2024-01-19T11:30:00"),
        tags: {
          connect: [{ name: "GitHub Actions" }, { name: "テスト" }],
        },
      },
    }),
    prisma.post.create({
      data: {
        title: "Cloudflare Workersの活用",
        content:
          "Cloudflare Workersを使用することで、エッジコンピューティング環境でJavaScriptコードを実行できます。レスポンス時間の改善に効果的です。",
        createdAt: new Date("2024-01-20T13:20:00"),
        updatedAt: new Date("2024-01-20T13:20:00"),
        tags: {
          connect: [
            { name: "Cloudflare" },
            { name: "JavaScript" },
            { name: "Node.js" },
          ],
        },
      },
    }),
    prisma.post.create({
      data: {
        title: "テスト駆動開発の実践",
        content:
          "TDD（Test Driven Development）は、テストを先に書いてからコードを実装する開発手法です。品質向上と設計改善に役立ちます。",
        createdAt: new Date("2024-01-21T15:10:00"),
        updatedAt: new Date("2024-01-21T15:10:00"),
        tags: {
          connect: [
            { name: "テスト" },
            { name: "TypeScript" },
            { name: "JavaScript" },
          ],
        },
      },
    }),
  ]);

  console.log("Posts created:", posts.length);

  // データ挿入の確認
  const result = await prisma.post.findMany({
    include: {
      tags: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log("Data verification:");
  result.forEach((post) => {
    console.log(`- ${post.title} (${post.tags.map((t) => t.name).join(", ")})`);
  });

  console.log("Test data seeding completed!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
