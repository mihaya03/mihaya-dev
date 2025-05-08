import type { GenericPrismaClient } from "../types/prisma.js";
import type { Tag } from "../core/post.js";
import {
  TagCreationError,
  TagDeletionError,
  DatabaseConnectionError,
} from "../core/error.js";
import { ResultAsync } from "neverthrow";
import { ulid } from "ulid";
// Edge 対応：Node ランタイムを引き込む runtime/library への直接依存を避ける
interface PrismaLikeError {
  code?: string;
  meta?: { target?: unknown };
  message?: string;
}

const isUniqueConstraintError = (e: unknown): boolean => {
  const err = e as PrismaLikeError | undefined;
  return !!err && err.code === "P2002";
};

/**
 * すべてのタグを取得します
 * @param prisma - Prismaクライアントインスタンス
 * @returns すべてのタグを取得する関数
 * @example
 * ```typescript
 * const getAllTags = findAllTags(prisma);
 * const result = await getAllTags();
 * ```
 */
export const findAllTags =
  (prisma: GenericPrismaClient) =>
  /**
   * すべてのタグを取得
   * @returns すべてのタグの配列、エラーの場合はDatabaseConnectionError
   */
  (): ResultAsync<Tag[], DatabaseConnectionError> => {
    return ResultAsync.fromPromise(
      prisma.tag.findMany({
        orderBy: { name: "asc" },
      }),
      (e) => new DatabaseConnectionError(e instanceof Error ? e : undefined),
    );
  };

/**
 * 指定されたIDのタグを検索します
 * @param prisma - Prismaクライアントインスタンス
 * @returns タグ検索関数（IDを受け取りResultAsyncを返す）
 * @example
 * ```typescript
 * const findTag = findTagById(prisma);
 * const result = await findTag("01234567890123456789012345");
 * ```
 */
export const findTagById =
  (prisma: GenericPrismaClient) =>
  /**
   * IDでタグを検索
   * @param id - タグID（ULID形式）
   * @returns タグデータまたはnull、エラーの場合はDatabaseConnectionError
   */
  (id: string): ResultAsync<Tag | null, DatabaseConnectionError> => {
    return ResultAsync.fromPromise(
      prisma.tag.findUnique({
        where: { id },
      }),
      (e) => new DatabaseConnectionError(e instanceof Error ? e : undefined),
    );
  };

/**
 * 指定された名前のタグを検索します
 * @param prisma - Prismaクライアントインスタンス
 * @returns タグ検索関数（名前を受け取りResultAsyncを返す）
 * @example
 * ```typescript
 * const findTag = findTagByName(prisma);
 * const result = await findTag("javascript");
 * ```
 */
export const findTagByName =
  (prisma: GenericPrismaClient) =>
  /**
   * 名前でタグを検索
   * @param name - タグ名
   * @returns タグデータまたはnull、エラーの場合はDatabaseConnectionError
   */
  (name: string): ResultAsync<Tag | null, DatabaseConnectionError> => {
    return ResultAsync.fromPromise(
      prisma.tag.findUnique({
        where: { name },
      }),
      (e) => new DatabaseConnectionError(e instanceof Error ? e : undefined),
    );
  };

/**
 * タグ作成を1回試行します（内部関数）
 * @param prisma - Prismaクライアントインスタンス
 * @param data - タグデータ（IDを除く）
 * @returns 作成されたタグまたはエラー
 * @internal
 */
const createTagAttempt = (
  prisma: GenericPrismaClient,
  data: Omit<Tag, "id">,
): ResultAsync<Tag, TagCreationError | DatabaseConnectionError> => {
  return ResultAsync.fromPromise(
    prisma.tag.create({
      data: {
        ...data,
        id: ulid(),
      },
    }),
    (e) => {
      if (isUniqueConstraintError(e)) {
        // meta.target 判定が無いので name 衝突か ULID 衝突かは区別不可
        // メッセージヒューリスティック等が必要なら後で追加
        return new TagCreationError("Unique constraint violation");
      }
      return new DatabaseConnectionError(e instanceof Error ? e : undefined);
    },
  );
};

/**
 * 新しいタグを作成します
 * ULID衝突が発生した場合は自動的にリトライします（最大5回）
 * @param prisma - Prismaクライアントインスタンス
 * @returns タグ作成関数
 * @example
 * ```typescript
 * const createNewTag = createTag(prisma);
 * const result = await createNewTag({
 *   name: "新しいタグ"
 * });
 * ```
 */
export const createTag =
  (prisma: GenericPrismaClient) =>
  /**
   * タグを作成
   * @param data - タグデータ（IDは自動生成）
   * @returns 作成されたタグ、エラーの場合はTagCreationErrorまたはDatabaseConnectionError
   */
  (
    data: Omit<Tag, "id">,
  ): ResultAsync<Tag, TagCreationError | DatabaseConnectionError> => {
    const MAX_RETRIES = 5;

    const attemptWithRetry = (
      attempt: number,
    ): ResultAsync<Tag, TagCreationError | DatabaseConnectionError> => {
      return createTagAttempt(prisma, data).orElse((error) => {
        if (
          error instanceof TagCreationError &&
          error.message.includes("ULID collision") &&
          attempt < MAX_RETRIES - 1
        ) {
          return attemptWithRetry(attempt + 1);
        }
        return ResultAsync.fromSafePromise(
          Promise.reject(
            error instanceof TagCreationError &&
              error.message.includes("ULID collision")
              ? new TagCreationError("ULID collision after maximum retries")
              : error,
          ),
        );
      });
    };

    return attemptWithRetry(0);
  };

/**
 * タグを削除します
 * @param prisma - Prismaクライアントインスタンス
 * @returns タグ削除関数
 * @example
 * ```typescript
 * const deleteExistingTag = deleteTag(prisma);
 * const result = await deleteExistingTag("01234567890123456789012345");
 * ```
 */
export const deleteTag =
  (prisma: GenericPrismaClient) =>
  /**
   * タグを削除
   * @param id - 削除するタグのID（ULID形式）
   * @returns 削除されたタグ、エラーの場合はTagDeletionErrorまたはDatabaseConnectionError
   */
  (
    id: string,
  ): ResultAsync<Tag, TagDeletionError | DatabaseConnectionError> => {
    return ResultAsync.fromPromise(
      prisma.tag.delete({
        where: { id },
      }),
      (e) => {
        const err = e as PrismaLikeError | undefined;
        if (err?.code === "P2025") {
          return new TagDeletionError("Tag not found");
        }
        if (err?.code === "P2003") {
          return new TagDeletionError(
            "Cannot delete tag: still referenced by posts",
          );
        }
        return new DatabaseConnectionError(e instanceof Error ? e : undefined);
      },
    );
  };

/**
 * 投稿に関連付けられていない孤立したタグを削除します
 * @param prisma - Prismaクライアントインスタンス
 * @returns タグクリーンアップ関数
 * @example
 * ```typescript
 * const cleanupTags = cleanupOrphanTags(prisma);
 * await cleanupTags(["tag-id-1", "tag-id-2"]);
 * ```
 */
export const cleanupOrphanTags =
  (prisma: GenericPrismaClient) =>
  /**
   * 指定されたタグIDのうち、投稿に関連付けられていないものを削除
   * @param tagIds - チェックするタグIDの配列
   * @returns 削除処理の結果
   */
  async (tagIds: string[]): Promise<void> => {
    for (const tagId of tagIds) {
      const tag = await prisma.tag.findUnique({
        where: { id: tagId },
        include: { posts: true },
      });

      if (tag && tag.posts.length === 0) {
        const deleteTagFn = deleteTag(prisma);
        const deleteResult = await deleteTagFn(tagId);

        if (deleteResult.isOk()) {
          console.log(`Deleted orphaned tag: ${tagId}`);
        } else {
          console.error(
            `Failed to delete tag ${tagId}:`,
            deleteResult.error.message,
          );
        }
      }
    }
  };
