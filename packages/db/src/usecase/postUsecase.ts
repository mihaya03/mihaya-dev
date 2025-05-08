import type { GenericPrismaClient } from "../types/prisma.js";
import type { Post } from "../core/post.js";
import {
  PostCreationError,
  PostUpdateError,
  PostDeletionError,
  DatabaseConnectionError,
} from "../core/error.js";
import { ResultAsync, err } from "neverthrow";
import { ulid } from "ulid";
// Edge 対応のため @prisma/client/runtime/library を直接 import せず、
// エラーオブジェクトの shape を動的に判定する軽量ガードを使用する。
interface PrismaLikeError {
  code?: string;
  meta?: { target?: unknown };
  message?: string;
}

const isUniqueConstraintError = (e: unknown): boolean => {
  const err = e as PrismaLikeError | undefined;
  if (!err || err.code !== "P2002") return false;
  return true; // target 判定は不要（衝突とみなす）
};

/**
 * 指定されたIDの投稿を検索する
 * @param prisma - Prismaクライアントインスタンス
 * @returns 投稿検索関数（IDを受け取りResultAsyncを返す）
 * @example
 * ```typescript
 * const findPost = findPostById(prisma);
 * const result = await findPost("01234567890123456789012345");
 * ```
 */
export const findPostById =
  (prisma: GenericPrismaClient) =>
  /**
   * IDで投稿を検索
   * @param id - 投稿ID（ULID形式）
   * @returns 投稿データまたはnull、エラーの場合はDatabaseConnectionError
   */
  (id: string): ResultAsync<Post | null, DatabaseConnectionError> => {
    return ResultAsync.fromPromise(
      prisma.post.findUnique({
        where: { id },
        include: { tags: true },
      }),
      (e) => new DatabaseConnectionError(e instanceof Error ? e : undefined),
    );
  };

/**
 * 指定されたタグ名で投稿を検索する
 * @param prisma - Prismaクライアントインスタンス
 * @returns タグ名で投稿を検索する関数
 * @example
 * ```typescript
 * const findPosts = findPostsByTagName(prisma);
 * const result = await findPosts("javascript");
 * ```
 */
export const findPostsByTagName =
  (prisma: GenericPrismaClient) =>
  /**
   * タグ名で投稿を検索する
   * @param tagName - 検索するタグ名
   * @returns 該当する投稿の配列、エラーの場合はDatabaseConnectionError
   */
  (tagName: string): ResultAsync<Post[], DatabaseConnectionError> => {
    return ResultAsync.fromPromise(
      prisma.post.findMany({
        where: {
          tags: {
            some: {
              name: tagName,
            },
          },
        },
        include: { tags: true },
      }),
      (e) => new DatabaseConnectionError(e instanceof Error ? e : undefined),
    );
  };

/**
 * すべての投稿を取得su
 * @param prisma - Prismaクライアントインスタンス
 * @returns すべての投稿を取得する関数
 * @example
 * ```typescript
 * const getAllPosts = findAllPosts(prisma);
 * const result = await getAllPosts();
 * ```
 */
export const findAllPosts =
  (prisma: GenericPrismaClient) =>
  /**
   * すべての投稿を取得
   * @returns すべての投稿の配列、エラーの場合はDatabaseConnectionError
   */
  (): ResultAsync<Post[], DatabaseConnectionError> => {
    return ResultAsync.fromPromise(
      prisma.post.findMany({
        include: { tags: true },
        orderBy: { createdAt: "desc" },
      }),
      (e) => new DatabaseConnectionError(e instanceof Error ? e : undefined),
    );
  };

/**
 * 投稿作成を1回試行します（内部関数）
 * @param prisma - Prismaクライアントインスタンス
 * @param data - 投稿データ（IDとタイムスタンプを除く）
 * @returns 作成された投稿またはエラー
 * @internal
 */
const createPostAttempt = (
  prisma: GenericPrismaClient,
  data: Omit<Post, "id" | "createdAt" | "updatedAt" | "tags"> & {
    tagIds?: string[];
  },
): ResultAsync<Post, PostCreationError | DatabaseConnectionError> => {
  return ResultAsync.fromPromise(
    prisma.post.create({
      data: {
        title: data.title,
        content: data.content,
        id: ulid(),
        tags: data.tagIds
          ? { connect: data.tagIds.map((id) => ({ id })) }
          : undefined,
      },
      include: { tags: true },
    }),
    (e) =>
      isUniqueConstraintError(e)
        ? new PostCreationError("ULID collision detected")
        : new DatabaseConnectionError(e instanceof Error ? e : undefined),
  );
};

/**
 * 新しい投稿を作成します
 * ULID衝突が発生した場合は自動的にリトライします（最大5回）
 * @param prisma - Prismaクライアントインスタンス
 * @returns 投稿作成関数
 * @example
 * ```typescript
 * const createNewPost = createPost(prisma);
 * const result = await createNewPost({
 *   title: "新しい投稿",
 *   content: "投稿内容",
 *   tagIds: ["tag1", "tag2"]
 * });
 * ```
 */
export const createPost =
  (prisma: GenericPrismaClient) =>
  /**
   * 投稿を作成
   * @param data - 投稿データ（IDとタイムスタンプは自動生成）
   * @param data.tagIds - 関連付けるタグのID配列（オプション）
   * @returns 作成された投稿、エラーの場合はPostCreationErrorまたはDatabaseConnectionError
   */
  (
    data: Omit<Post, "id" | "createdAt" | "updatedAt" | "tags"> & {
      tagIds?: string[];
    },
  ): ResultAsync<Post, PostCreationError | DatabaseConnectionError> => {
    const MAX_RETRIES = 5;

    const attemptWithRetry = (
      attempt: number,
    ): ResultAsync<Post, PostCreationError | DatabaseConnectionError> => {
      return createPostAttempt(prisma, data).orElse((error) => {
        if (
          error instanceof PostCreationError &&
          error.message.includes("ULID collision") &&
          attempt < MAX_RETRIES - 1
        ) {
          return attemptWithRetry(attempt + 1);
        }
        return err(
          error instanceof PostCreationError &&
            error.message.includes("ULID collision")
            ? new PostCreationError("ULID collision after maximum retries")
            : error,
        );
      });
    };

    return attemptWithRetry(0);
  };

/**
 * 投稿を更新する
 * @param prisma - Prismaクライアントインスタンス
 * @returns 投稿更新関数
 * @example
 * ```typescript
 * const updateExistingPost = updatePost(prisma);
 * const result = await updateExistingPost("01234567890123456789012345", {
 *   title: "更新された投稿",
 *   content: "更新された内容"
 * });
 * ```
 */
export const updatePost =
  (prisma: GenericPrismaClient) =>
  /**
   * 投稿を更新
   * @param id - 更新する投稿のID（ULID形式）
   * @param data - 更新データ
   * @returns 更新された投稿、エラーの場合はPostUpdateErrorまたはDatabaseConnectionError
   */
  (
    id: string,
    data: Partial<Omit<Post, "id" | "createdAt" | "updatedAt" | "tags">> & {
      tagIds?: string[];
    },
  ): ResultAsync<Post, PostUpdateError | DatabaseConnectionError> => {
    return ResultAsync.fromPromise(
      prisma.post.update({
        where: { id },
        data: {
          title: data.title,
          content: data.content,
          tags: data.tagIds
            ? { set: data.tagIds.map((tagId) => ({ id: tagId })) }
            : undefined,
        },
        include: { tags: true },
      }),
      (e) => {
        const err = e as PrismaLikeError | undefined;
        if (err?.code === "P2025") {
          return new PostUpdateError("Post not found");
        }
        if (err?.code === "P2003") {
          return new PostUpdateError("Invalid tag reference");
        }
        return new DatabaseConnectionError(e instanceof Error ? e : undefined);
      },
    );
  };

/**
 * 投稿を削除する
 * @param prisma - Prismaクライアントインスタンス
 * @returns 投稿削除関数
 * @example
 * ```typescript
 * const deleteExistingPost = deletePost(prisma);
 * const result = await deleteExistingPost("01234567890123456789012345");
 * ```
 */
export const deletePost =
  (prisma: GenericPrismaClient) =>
  /**
   * 投稿を削除
   * @param id - 削除する投稿のID（ULID形式）
   * @returns 削除された投稿、エラーの場合はPostDeletionErrorまたはDatabaseConnectionError
   */
  (
    id: string,
  ): ResultAsync<Post, PostDeletionError | DatabaseConnectionError> => {
    return ResultAsync.fromPromise(
      prisma.post.delete({
        where: { id },
        include: { tags: true },
      }),
      (e) => {
        const err = e as PrismaLikeError | undefined;
        if (err?.code === "P2025") {
          return new PostDeletionError("Post not found");
        }
        return new DatabaseConnectionError(e instanceof Error ? e : undefined);
      },
    );
  };
