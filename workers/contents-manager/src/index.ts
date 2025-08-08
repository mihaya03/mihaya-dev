import {
	createPrismaEdge,
	createPost,
	updatePost,
	deletePost,
	findPostByR2FileName,
	findTagByName,
	createTag,
	cleanupOrphanTags,
} from "@repo/db/index-edge";
import type { Tag } from "@repo/db/index-edge";
import { parseFrontmatter } from "@repo/markdown/frontmatter";

/**
 * R2ストレージサービスからのイベント通知を表すインターフェース
 *
 * @interface R2EventNotification
 * @property account - イベントに関連付けられたアカウント識別子
 * @property action - 実行されたアクション（例："PUT"、"DELETE"）
 * @property bucket - イベントが発生したバケット名
 * @property object - 対象オブジェクトの詳細情報
 * @property object.key - バケット内のオブジェクトのキー（パス）
 * @property object.size - オブジェクトのサイズ（バイト単位）
 * @property object.eTag - オブジェクトのエンティティタグ（ETag）
 * @property eventTime - イベントが発生したISOタイムスタンプ
 * @property copySource - （オプション）オブジェクトがコピーされた場合のソース情報
 * @property copySource.bucket - ソースバケット名
 * @property copySource.object - ソースオブジェクトキー
 */
interface R2EventNotification {
	account: string;
	action: string;
	bucket: string;
	object: {
		key: string;
		size: number;
		eTag: string;
	};
	eventTime: string;
	copySource?: {
		bucket: string;
		object: string;
	};
}

export default {
	/**
	 * HTTPリクエストを処理するメソッド
	 * @param {Request} req - HTTPリクエストオブジェクト
	 * @param {Env} env - 環境変数
	 * @returns {Promise<Response>} HTTPレスポンス
	 */
	async fetch(req, env): Promise<Response> {
		const url = new URL(req.url);

		if (url.pathname === "/api/health") {
			return new Response(
				JSON.stringify({
					status: "healthy",
					timestamp: new Date().toISOString(),
					environment: env.ENVIRONMENT || "unknown",
				}),
				{
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		return new Response(
			JSON.stringify({
				message: "Contents Manager API",
				version: "1.0.0",
				endpoints: ["/api/health"],
			}),
			{
				headers: { "Content-Type": "application/json" },
			},
		);
	},

	/**
	 * キューのメッセージバッチを処理するメソッド
	 * @param {MessageBatch<R2EventNotification>} batch - R2イベント通知のメッセージバッチ
	 * @param {Env} env - 環境変数
	 * @returns {Promise<void>}
	 */
	async queue(
		batch: MessageBatch<R2EventNotification>,
		env: Env,
	): Promise<void> {
		console.log(`Processing batch of ${batch.messages.length} messages`);

		for (const message of batch.messages) {
			try {
				const body = message.body;
				console.log(`[Queue] Processing R2 event ${message.id}:`, {
					action: body.action,
					bucket: body.bucket,
					key: body.object.key,
					eventTime: body.eventTime,
					messageId: message.id,
				});

				await processR2Event(body, env);

				console.log(`[Queue] Message ${message.id} processed successfully`);
			} catch (error) {
				console.error(
					`[Queue] Failed to process message ${message.id}:`,
					error,
				);
			}
		}

		console.log(`[Queue] Batch processing completed`);
	},
} satisfies ExportedHandler<Env, R2EventNotification>;

/**
 * R2バケットから指定されたキーのオブジェクトを取得し、テキストとして返す
 * @param {Env} env - 環境変数（R2_BUCKETバインディングを含む）
 * @param {string} key - 取得するオブジェクトのキー
 * @returns {Promise<string>} オブジェクトのテキスト内容
 * @throws {Error} オブジェクトが見つからない場合
 */
const fetchFromR2 = async (env: Env, key: string): Promise<string> => {
	const object = await env.R2_BUCKET.get(key);
	if (!object) {
		throw new Error(`Object not found: ${key}`);
	}
	return await object.text();
};

/**
 * オブジェクトキーからポストIDを抽出する
 * @param {string} key - オブジェクトのキー（ファイルパス）
 * @returns {string} マークダウンファイル名から拡張子を除いたポストID
 * @throws {Error} 無効なマークダウンファイルの場合
 */
const extractFileBaseNameFromKey = (key: string): string => {
	const fileName = key.split("/").pop();
	if (!fileName || !fileName.endsWith(".md")) {
		throw new Error(`Invalid markdown file: ${key}`);
	}
	return fileName.replace(".md", "");
};

type PrismaEdgeClient = Awaited<ReturnType<typeof createPrismaEdge>>;
/**
 * ポスト用のタグを処理し、タグIDの配列を返す
 * 既存のタグは検索して取得し、存在しないタグは新規作成する
 * @param {PrismaEdgeClient} prisma - Prismaクライアント
 * @param {string[]} tagNames - 処理するタグ名の配列
 * @returns {Promise<string[]>} 処理されたタグのID配列
 */
const processTagsForPost = async (
	prisma: PrismaEdgeClient,
	tagNames: string[],
): Promise<string[]> => {
	const tagIds: string[] = [];

	for (const tagName of tagNames) {
		const findTagFn = findTagByName(prisma);
		const tagResult = await findTagFn(tagName);

		if (tagResult.isErr()) {
			console.error(`Error finding tag ${tagName}:`, tagResult.error.message);
			continue;
		}

		if (tagResult.value) {
			tagIds.push(tagResult.value.id);
		} else {
			const createTagFn = createTag(prisma);
			const createResult = await createTagFn({ name: tagName });

			if (createResult.isErr()) {
				console.error(
					`Error creating tag ${tagName}:`,
					createResult.error.message,
				);
				continue;
			}

			tagIds.push(createResult.value.id);
			console.log(`Created new tag: ${tagName}`);
		}
	}

	return tagIds;
};

/**
 * マークダウンファイルのR2イベント通知を処理し、ポストデータをデータベースと同期する
 *
 * この関数は`.md`で終わるファイルのR2オブジェクトイベント（作成、更新、削除）を処理する。
 * - 削除イベント（`DeleteObject`、`LifecycleDeletion`）の場合：対応するポストを削除し、孤立したタグをクリーンアップする
 * - 作成・更新イベント（`PutObject`、`CopyObject`、`CompleteMultipartUpload`）の場合：
 *   マークダウンファイルを解析してフロントマター（タグを含む）を抽出し、
 *   データベース内でポストを作成または更新し、タグの関連付けを管理する
 *
 * @param {R2EventNotification} event - オブジェクトキーとアクションタイプを含むR2イベント通知
 * @param {Env} env - データベースURLやR2バインディングなどの設定を含む環境オブジェクト
 * @returns {Promise<void>} イベントが完全に処理されたときに解決されるPromise
 * @throws データベースエラーや処理エラーが発生した場合に例外をスローする
 */
const processR2Event = async (
	event: R2EventNotification,
	env: Env,
): Promise<void> => {
	if (!event.object.key.endsWith(".md")) {
		console.log(`Skipping non-markdown file: ${event.object.key}`);
		return;
	}

	const prisma = await createPrismaEdge(env.DATABASE_URL);

	try {
		const fileBaseName = extractFileBaseNameFromKey(event.object.key);

		// Delete events: DeleteObject, LifecycleDeletion
		if (
			event.action === "DeleteObject" ||
			event.action === "LifecycleDeletion"
		) {
			console.log(`Deleting post by r2FileName: ${fileBaseName}`);

			// Look up by r2FileName first
			const findByFileFn = findPostByR2FileName(prisma);
			const postResult = await findByFileFn(fileBaseName);

			if (postResult.isErr()) {
				console.error(
					`Error finding post by r2FileName ${fileBaseName}:`,
					postResult.error.message,
				);
				throw postResult.error;
			}

			const tagIds = postResult.value?.tags?.map((tag: Tag) => tag.id) || [];
			if (!postResult.value) {
				console.log(`No existing post for r2FileName ${fileBaseName}`);
				return;
			}
			const deletePostFn = deletePost(prisma);
			const result = await deletePostFn(postResult.value.id);

			if (result.isErr()) {
				console.error(
					`Failed to delete post id=${postResult.value.id}:`,
					result.error.message,
				);
				throw result.error;
			}

			console.log(`Successfully deleted post id=${postResult.value.id}`);

			// Clean up orphaned tags
			if (tagIds.length > 0) {
				const cleanupTagsFn = cleanupOrphanTags(prisma);
				await cleanupTagsFn(tagIds);
			}

			return;
		}

		// Create/Update events: PutObject, CopyObject, CompleteMultipartUpload
		if (
			event.action === "PutObject" ||
			event.action === "CopyObject" ||
			event.action === "CompleteMultipartUpload"
		) {
			console.log(`Processing markdown file: ${event.object.key}`);
			const content = await fetchFromR2(env, event.object.key);
			const { frontmatter, content: body } = parseFrontmatter(content);

			// Process tags from frontmatter
			const tagNames = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
			const tagIds = await processTagsForPost(prisma, tagNames);
			console.log(`Processed tags for fileBaseName ${fileBaseName}:`, tagNames);

			const findByFileFn = findPostByR2FileName(prisma);
			const existingPostResult = await findByFileFn(fileBaseName);

			if (existingPostResult.isErr()) {
				console.error(
					`Database error when checking existing post:`,
					existingPostResult.error.message,
				);
				throw existingPostResult.error;
			}

			if (existingPostResult.value) {
				console.log(
					`Updating existing post id=${existingPostResult.value.id} (r2FileName=${fileBaseName})`,
				);
				const updatePostFn = updatePost(prisma);
				const result = await updatePostFn(existingPostResult.value.id, {
					title: frontmatter.title,
					content: body,
					tagIds,
					r2FileName: fileBaseName,
				});

				if (result.isErr()) {
					console.error(
						`Failed to update post id=${existingPostResult.value.id}:`,
						result.error.message,
					);
					throw result.error;
				}

				console.log(
					`Successfully updated post id=${existingPostResult.value.id}`,
				);
			} else {
				console.log(`Creating new post for r2FileName=${fileBaseName}`);
				const createPostFn = createPost(prisma);
				const result = await createPostFn({
					title: frontmatter.title,
					content: body,
					tagIds,
					r2FileName: fileBaseName,
				});

				if (result.isErr()) {
					console.error(
						`Failed to create post (r2FileName=${fileBaseName}):`,
						result.error.message,
					);
					throw result.error;
				}

				console.log(`Successfully created post (r2FileName=${fileBaseName})`);
			}
		}
	} catch (error) {
		console.error(`Error processing R2 event for ${event.object.key}:`, error);
		throw error;
	}
};
