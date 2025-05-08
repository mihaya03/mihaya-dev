// Edge runtime で process が未定義の場合に備えて安全に参照するヘルパ
interface MaybeNodeProcessEnv {
  process?: { env?: Record<string, string | undefined> };
}
import { PrismaClient as EdgePrismaClient } from "@prisma/client/edge";

// Edge 専用 Prisma ファクトリ（Node版クライアントを一切importしない）
let edgePrisma: EdgePrismaClient | null = null;
let currentEdgeDatabaseUrl: string | null = null;

interface CreatePrismaEdgeOptions {
  /** 強制的に Accelerate を有効化 */
  forceAccelerate?: boolean;
  /** Accelerate を無効化 (forceAccelerate より優先) */
  disableAccelerate?: boolean;
}

/**
 * Edge環境専用 PrismaClient 生成（URL 変更なしならシングルトンを返却）
 * Node版エンジンやfileURLToPathを一切含まない
 */
export const createPrismaEdge = async (
  databaseUrl: string,
  options: CreatePrismaEdgeOptions = {},
): Promise<EdgePrismaClient> => {
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required. Provide it to createPrismaEdge().",
    );
  }

  // 既存再利用
  if (edgePrisma && currentEdgeDatabaseUrl === databaseUrl) {
    return edgePrisma;
  }

  // URL 変更時は破棄
  if (
    edgePrisma &&
    currentEdgeDatabaseUrl &&
    currentEdgeDatabaseUrl !== databaseUrl
  ) {
    try {
      edgePrisma.$disconnect().catch(() => {});
    } catch {
      /* ignore */
    }
    edgePrisma = null;
  }

  const nodeEnv = (globalThis as unknown as MaybeNodeProcessEnv)?.process?.env
    ?.NODE_ENV;
  console.log(
    `[Prisma Edge Config] runtime=edge adapter=false NODE_ENV=${nodeEnv ?? "unknown"}`,
  );

  const envVars =
    (globalThis as unknown as MaybeNodeProcessEnv)?.process?.env || {};
  const explicitlyDisabled =
    options.disableAccelerate === true ||
    envVars.ACCELERATE_DISABLED === "true";
  const explicitlyEnabled =
    options.forceAccelerate === true || envVars.ACCELERATE_ENABLED === "true";
  // デフォルト: Edge では Accelerate 無効（明示有効化が無ければ）
  const disableAccelerate = explicitlyDisabled || !explicitlyEnabled;

  const client = new EdgePrismaClient({
    datasourceUrl: databaseUrl,
  });

  if (disableAccelerate) {
    edgePrisma = client;
  } else {
    // 動的 import (Edge バンドル時に未使用なら除外され Node API 依存を避ける)
    const mod = await import("@prisma/extension-accelerate");
    edgePrisma = client.$extends(
      mod.withAccelerate(),
    ) as unknown as EdgePrismaClient;
  }

  currentEdgeDatabaseUrl = databaseUrl;

  if (!edgePrisma) {
    throw new Error("Failed to create Edge Prisma client");
  }

  return edgePrisma;
};

// テストやスクリプトで明示破棄したい場合
export const disposeEdgePrisma = async () => {
  if (edgePrisma) {
    try {
      await edgePrisma.$disconnect();
    } finally {
      edgePrisma = null;
      currentEdgeDatabaseUrl = null;
    }
  }
};
