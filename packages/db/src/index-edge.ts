// Edge Runtime 専用エントリポイント
// Node.js 向け Prisma 初期化(createPrisma 等)を含めず、
// Cloudflare Workers で不要/非対応のコード混入を防ぐ

export { createPrismaEdge } from "./config/prisma-edge.js";

// Usecases
export * from "./usecase/postUsecase.js";
export * from "./usecase/tagUsecase.js";

// Gateways
export * from "./gateway/postGateway.js";
export * from "./gateway/tagGateway.js";

// Domain / Error
export * from "./core/error.js";
export * from "./core/post.js";
