// Node 実行専用 Prisma Client ラッパ
// Edge / Workers (非 Node) では import しないこと
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prismaNode__: PrismaClient | undefined;
}

function createClient() {
  // ここで Node 環境チェック（Next.js の edge/experimental 環境混入防止）
  if (typeof process === "undefined" || process.release?.name !== "node") {
    throw new Error("prisma-node: Node.js ランタイム以外では使用できません");
  }
  return new PrismaClient();
}

export const prisma =
  global.__prismaNode__ ?? (global.__prismaNode__ = createClient());

// 明示的取得用（必要なら）
export function getPrisma() {
  return prisma;
}
