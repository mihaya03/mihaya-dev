/**
 * データベース操作に関連するエラーの基底クラス
 * すべてのデータベースエラーはこのクラスを継承する
 */
export abstract class DatabaseError extends Error {
  /** エラーコード（各エラータイプで一意） */
  abstract readonly code: string;
}

/**
 * 投稿作成時に発生するエラー
 * ULID衝突やバリデーションエラーなどで投稿作成が失敗した場合に使用
 */
export class PostCreationError extends DatabaseError {
  readonly code = "POST_CREATION_FAILED";

  /**
   * @param reason - エラーの詳細理由
   * @example
   * ```typescript
   * throw new PostCreationError("ULID collision detected");
   * ```
   */
  constructor(reason: string) {
    super(`Failed to create post: ${reason}`);
    this.name = "PostCreationError";
  }
}

/**
 * 投稿更新時に発生するエラー
 * 投稿が見つからない場合や無効なタグ参照などで更新が失敗した場合に使用
 */
export class PostUpdateError extends DatabaseError {
  readonly code = "POST_UPDATE_FAILED";

  /**
   * @param reason - エラーの詳細理由
   * @example
   * ```typescript
   * throw new PostUpdateError("Post not found");
   * ```
   */
  constructor(reason: string) {
    super(`Failed to update post: ${reason}`);
    this.name = "PostUpdateError";
  }
}

/**
 * 投稿削除時に発生するエラー
 * 投稿が見つからない場合や外部キー制約などで削除が失敗した場合に使用
 */
export class PostDeletionError extends DatabaseError {
  readonly code = "POST_DELETION_FAILED";

  /**
   * @param reason - エラーの詳細理由
   * @example
   * ```typescript
   * throw new PostDeletionError("Post not found");
   * ```
   */
  constructor(reason: string) {
    super(`Failed to delete post: ${reason}`);
    this.name = "PostDeletionError";
  }
}

/**
 * タグ作成時に発生するエラー
 * タグ名の重複やULID衝突などでタグ作成が失敗した場合に使用
 */
export class TagCreationError extends DatabaseError {
  readonly code = "TAG_CREATION_FAILED";

  /**
   * @param reason - エラーの詳細理由
   * @example
   * ```typescript
   * throw new TagCreationError("Tag name already exists");
   * ```
   */
  constructor(reason: string) {
    super(`Failed to create tag: ${reason}`);
    this.name = "TagCreationError";
  }
}

/**
 * タグ削除時に発生するエラー
 * タグが見つからない場合や投稿で参照されているタグの削除を試みた場合に使用
 */
export class TagDeletionError extends DatabaseError {
  readonly code = "TAG_DELETION_FAILED";

  /**
   * @param reason - エラーの詳細理由
   * @example
   * ```typescript
   * throw new TagDeletionError("Cannot delete tag: still referenced by posts");
   * ```
   */
  constructor(reason: string) {
    super(`Failed to delete tag: ${reason}`);
    this.name = "TagDeletionError";
  }
}

/**
 * タグが見つからない場合のエラー
 * @deprecated 新しい設計では検索結果がnullの場合はエラーではなく正常なケースとして扱う
 */
export class TagNotFoundError extends DatabaseError {
  readonly code = "TAG_NOT_FOUND";

  /**
   * @param name - 見つからなかったタグ名
   * @deprecated findTagByName等はnullを返すように変更されました
   */
  constructor(name: string) {
    super(`Tag with name ${name} not found`);
    this.name = "TagNotFoundError";
  }
}

/**
 * データベース接続や低レベルな操作で発生するエラー
 * ネットワーク障害、認証エラー、SQLエラーなどの場合に使用
 */
export class DatabaseConnectionError extends DatabaseError {
  readonly code = "DATABASE_CONNECTION_FAILED";

  /**
   * @param originalError - 元となったエラーオブジェクト（オプション）
   * @example
   * ```typescript
   * // Prismaエラーをラップ
   * throw new DatabaseConnectionError(prismaError);
   *
   * // 一般的なデータベースエラー
   * throw new DatabaseConnectionError();
   * ```
   */
  constructor(originalError?: Error) {
    super(
      `Database connection failed: ${originalError?.message || "Unknown error"}`,
    );
    this.name = "DatabaseConnectionError";
  }
}
