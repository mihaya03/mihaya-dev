import type { PrismaClient } from "@prisma/client";
import * as usecase from "../usecase/tagUsecase.js";
import type { Tag } from "../core/post.js";
import {
  DatabaseConnectionError,
  TagCreationError,
  TagDeletionError,
} from "../core/error.js";
import { Result } from "neverthrow";

/**
 * タグデータの永続化を抽象化するリポジトリインターフェース
 */
export interface TagRepository {
  /**
   * IDでタグを検索
   * @param id - タグID（ULID形式）
   * @returns タグデータまたはnull（見つからない場合）、エラーの場合はDatabaseConnectionError
   */
  findById(id: string): Promise<Result<Tag | null, DatabaseConnectionError>>;

  /**
   * 名前でタグを検索
   * @param name - タグ名
   * @returns タグデータまたはnull（見つからない場合）、エラーの場合はDatabaseConnectionError
   */
  findByName(
    name: string,
  ): Promise<Result<Tag | null, DatabaseConnectionError>>;

  /**
   * すべてのタグを取得
   * @returns すべてのタグの配列またはエラー
   */
  findAll(): Promise<Result<Tag[], DatabaseConnectionError>>;

  /**
   * 新しいタグを作成
   * @param data - タグ作成データ
   * @returns 作成されたタグまたはエラー
   */
  create(
    data: CreateTagData,
  ): Promise<Result<Tag, TagCreationError | DatabaseConnectionError>>;

  /**
   * タグを削除
   * @param id - 削除するタグのID
   * @returns 削除されたタグまたはエラー
   */
  delete(
    id: string,
  ): Promise<Result<Tag, TagDeletionError | DatabaseConnectionError>>;
}

/**
 * タグ作成に必要なデータ型
 * IDは自動生成されるため除外
 */
export type CreateTagData = Omit<Tag, "id">;

/**
 * Prismaを使用したタグリポジトリの実装
 * TagRepositoryインターフェースを実装し、データベースアクセスを提供
 */
export class PrismaTagRepository implements TagRepository {
  /**
   * @param prisma - Prismaクライアントインスタンス
   */
  constructor(private readonly prisma: PrismaClient) {}

  async findById(
    id: string,
  ): Promise<Result<Tag | null, DatabaseConnectionError>> {
    return usecase.findTagById(this.prisma)(id);
  }

  async findByName(
    name: string,
  ): Promise<Result<Tag | null, DatabaseConnectionError>> {
    return usecase.findTagByName(this.prisma)(name);
  }

  async findAll(): Promise<Result<Tag[], DatabaseConnectionError>> {
    return usecase.findAllTags(this.prisma)();
  }

  async create(
    data: CreateTagData,
  ): Promise<Result<Tag, TagCreationError | DatabaseConnectionError>> {
    return usecase.createTag(this.prisma)(data);
  }

  async delete(
    id: string,
  ): Promise<Result<Tag, TagDeletionError | DatabaseConnectionError>> {
    return usecase.deleteTag(this.prisma)(id);
  }
}

/**
 * タグリポジトリのファクトリー関数
 * @param prisma - Prismaクライアントインスタンス
 * @returns TagRepositoryインターフェースを実装したインスタンス
 * @example
 * ```typescript
 * const repository = createTagRepository(prisma);
 * const result = await repository.findById("01234567890123456789012345");
 * ```
 */
export const createTagRepository = (prisma: PrismaClient): TagRepository =>
  new PrismaTagRepository(prisma);
