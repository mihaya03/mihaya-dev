/* eslint-disable turbo/no-undeclared-env-vars */
import { PrismaClient as NodePrismaClient } from "@prisma/client";
import { PrismaClient as EdgePrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaTiDBCloud } from "@tidbcloud/prisma-adapter";

// Increase max listeners to avoid warning during build (Node.js only)
if (
  typeof process !== "undefined" &&
  process.setMaxListeners &&
  (process.env.NODE_ENV === "production" ||
    process.env.NODE_ENV === "development")
) {
  process.setMaxListeners(20);
}

// 型エラー回避のため PrismaClient を NodePrismaClient として扱う（Edge版もキャスト統一）
let prisma: NodePrismaClient | null = null;
let currentDatabaseUrl: string | null = null;

interface CreatePrismaOptions {
  /**
   * TiDB Cloud アダプタを強制的に使う
   * 省略時: 環境変数 USE_TIDB_ADAPTER === 'true' かつ NODE_ENV !== 'test'
   */
  useTiDBAdapter?: boolean;
  /**
   * Accelerate 拡張を無効化する（アダプタ利用時は自動で無効化）
   */
  disableAccelerate?: boolean;
}

/**
 * PrismaClient 生成（URL 変更なしならシングルトンを返却）
 */
export const createPrisma = (
  databaseUrl: string,
  options: CreatePrismaOptions = {},
): NodePrismaClient => {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required. Provide it to createPrisma().");
  }

  const isTest = process.env.NODE_ENV === "test";
  const envWantsAdapter = process.env.USE_TIDB_ADAPTER === "true";
  const wantAdapter = options.useTiDBAdapter ?? (envWantsAdapter && !isTest);

  // 既存再利用
  if (prisma && currentDatabaseUrl === databaseUrl) {
    return prisma;
  }

  // URL 変更時は破棄
  if (prisma && currentDatabaseUrl && currentDatabaseUrl !== databaseUrl) {
    try {
      prisma.$disconnect().catch(() => {});
    } catch {
      /* ignore */
    }
    prisma = null;
  }

  const runtimeKind =
    typeof process === "undefined"
      ? "edge-like (no process)"
      : process.release?.name === "node"
        ? "node"
        : "unknown";

  console.log(
    `[Prisma Config] runtime=${runtimeKind} adapter=${wantAdapter} NODE_ENV=${process.env.NODE_ENV}`,
  );

  const isNode = runtimeKind === "node";
  const isEdge = !isNode; // Workers 環境含む

  if (wantAdapter) {
    // Adapter は Node クライアントのみ利用可
    if (!isNode) {
      console.warn(
        "[Prisma Config] Adapter requested but non-Node runtime detected. Falling back to Edge client without adapter.",
      );
    } else {
      const adapter = new PrismaTiDBCloud({ url: databaseUrl });
      // Prisma 6.x では Prisma.PrismaClientOptions 名前空間型がエクスポートされないため any キャストで回避
      // 将来的に型が公開されたら置き換える
      // Prisma の公開型には adapter プロパティがまだ含まれないため Parameters 経由で緩和キャスト
      // Adapter option is injected by driver adapter (TiDB). Safe at runtime; suppressed for lack of public types.
      // Prisma の型定義にはまだ adapter フィールドが含まれないため any キャストで回避
      // 公開型が更新されたらキャスト除去する
      // 型定義に adapter フィールドが未公開のためコンストラクタを unknown 経由でキャスト
      prisma = new (NodePrismaClient as unknown as new (
        args?: unknown,
      ) => NodePrismaClient)({
        adapter,
      } as unknown);
      currentDatabaseUrl = databaseUrl;
      return prisma;
    }
  }

  // Edge ルート: Edge PrismaClient + (Accelerate 任意)
  if (isEdge) {
    const edgeClient = new EdgePrismaClient({
      datasourceUrl: databaseUrl,
    });
    const disableAccelerate =
      options.disableAccelerate ||
      process.env.ACCELERATE_DISABLED === "true" ||
      false;
    prisma = disableAccelerate
      ? (edgeClient as unknown as NodePrismaClient)
      : (edgeClient.$extends(withAccelerate()) as unknown as NodePrismaClient);
    currentDatabaseUrl = databaseUrl;
    return prisma;
  }

  // Node (非 adapter)
  const disableAccelerate =
    options.disableAccelerate ||
    process.env.ACCELERATE_DISABLED === "true" ||
    false;

  let client: NodePrismaClient = new NodePrismaClient({
    datasourceUrl: databaseUrl,
  });

  if (!disableAccelerate) {
    client = client.$extends(withAccelerate()) as unknown as NodePrismaClient;
  }

  prisma = client;
  currentDatabaseUrl = databaseUrl;

  if (!prisma) {
    throw new Error("Failed to create Prisma client");
  }

  return prisma;
};

// テストやスクリプトで明示破棄したい場合
export const disposePrisma = async () => {
  if (prisma) {
    try {
      await prisma.$disconnect();
    } finally {
      prisma = null;
      currentDatabaseUrl = null;
    }
  }
};
