import type { PrismaClient } from "@prisma/client";
import * as usecase from "../usecase/postUsecase.js";
import type { Post } from "../core/post.js";
import {
  DatabaseConnectionError,
  PostCreationError,
  PostUpdateError,
  PostDeletionError,
} from "../core/error.js";
import { Result } from "neverthrow";

/**
 * 投稿データの永続化を抽象化するリポジトリインターフェース
 */
export interface PostRepository {
  /**
   * IDで投稿を検索
   * @param id - 投稿ID（ULID形式）
   * @returns 投稿データまたはnull（見つからない場合）、エラーの場合はDatabaseConnectionError
   */
  findById(id: string): Promise<Result<Post | null, DatabaseConnectionError>>;

  /**
   * すべての投稿を取得
   * @returns すべての投稿の配列またはエラー
   */
  findAll(): Promise<Result<Post[], DatabaseConnectionError>>;

  /**
   * タグ名で投稿を検索
   * @param tagName - 検索するタグ名
   * @returns 該当する投稿の配列またはエラー
   */
  findByTagName(
    tagName: string,
  ): Promise<Result<Post[], DatabaseConnectionError>>;

  /**
   * 新しい投稿を作成
   * @param data - 投稿作成データ
   * @returns 作成された投稿またはエラー
   */
  create(
    data: CreatePostData,
  ): Promise<Result<Post, PostCreationError | DatabaseConnectionError>>;

  /**
   * 投稿を更新
   * @param id - 更新する投稿のID
   * @param data - 更新データ
   * @returns 更新された投稿またはエラー
   */
  update(
    id: string,
    data: UpdatePostData,
  ): Promise<Result<Post, PostUpdateError | DatabaseConnectionError>>;

  /**
   * 投稿を削除
   * @param id - 削除する投稿のID
   * @returns 削除された投稿またはエラー
   */
  delete(
    id: string,
  ): Promise<Result<Post, PostDeletionError | DatabaseConnectionError>>;
}

/**
 * 投稿作成に必要なデータ型
 * IDとタイムスタンプは自動生成されるため除外
 */
export type CreatePostData = Omit<
  Post,
  "id" | "createdAt" | "updatedAt" | "tags"
> & {
  /** 関連付けるタグのID配列（オプション） */
  tagIds?: string[];
  /** R2上Markdownファイル名（拡張子除去後）。重複生成防止のための一意キー */
  r2FileName?: string | null;
};

/**
 * 投稿更新に必要なデータ型
 * IDとタイムスタンプは自動生成されるため除外、他はPartial
 */
export type UpdatePostData = Partial<
  Omit<Post, "id" | "createdAt" | "updatedAt" | "tags">
> & {
  /** 関連付けるタグのID配列（オプション） */
  tagIds?: string[];
  /** R2上Markdownファイル名（拡張子除去後）。重複生成防止のための一意キー */
  r2FileName?: string | null;
};

/**
 * Prismaを使用した投稿リポジトリの実装
 * PostRepositoryインターフェースを実装し、データベースアクセスを提供
 */
export class PrismaPostRepository implements PostRepository {
  /**
   * @param prisma - Prismaクライアントインスタンス
   */
  constructor(private readonly prisma: PrismaClient) {}

  async findById(
    id: string,
  ): Promise<Result<Post | null, DatabaseConnectionError>> {
    return usecase.findPostById(this.prisma)(id);
  }

  async findAll(): Promise<Result<Post[], DatabaseConnectionError>> {
    return usecase.findAllPosts(this.prisma)();
  }

  async findByTagName(
    tagName: string,
  ): Promise<Result<Post[], DatabaseConnectionError>> {
    return usecase.findPostsByTagName(this.prisma)(tagName);
  }

  async create(
    data: CreatePostData,
  ): Promise<Result<Post, PostCreationError | DatabaseConnectionError>> {
    return usecase.createPost(this.prisma)(data);
  }

  async update(
    id: string,
    data: UpdatePostData,
  ): Promise<Result<Post, PostUpdateError | DatabaseConnectionError>> {
    return usecase.updatePost(this.prisma)(id, data);
  }

  async delete(
    id: string,
  ): Promise<Result<Post, PostDeletionError | DatabaseConnectionError>> {
    return usecase.deletePost(this.prisma)(id);
  }
}

/**
 * 投稿リポジトリのファクトリー関数
 * @param prisma - Prismaクライアントインスタンス
 * @returns PostRepositoryインターフェースを実装したインスタンス
 * @example
 * ```typescript
 * const repository = createPostRepository(prisma);
 * const result = await repository.findById("01234567890123456789012345");
 * ```
 */
export const createPostRepository = (prisma: PrismaClient): PostRepository =>
  new PrismaPostRepository(prisma);
