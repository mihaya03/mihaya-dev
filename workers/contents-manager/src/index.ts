import {
	createPrismaEdge,
	createPost,
	updatePost,
	deletePost,
	findPostById,
	findTagByName,
	createTag,
	cleanupOrphanTags,
} from "@repo/db/index-edge";
import { parseFrontmatter } from "@repo/markdown/frontmatter";

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

const fetchFromR2 = async (env: Env, key: string): Promise<string> => {
	const object = await env.R2_BUCKET.get(key);
	if (!object) {
		throw new Error(`Object not found: ${key}`);
	}
	return await object.text();
};

const extractPostIdFromKey = (key: string): string => {
	const fileName = key.split("/").pop();
	if (!fileName || !fileName.endsWith(".md")) {
		throw new Error(`Invalid markdown file: ${key}`);
	}
	return fileName.replace(".md", "");
};

type PrismaEdgeClient = Awaited<ReturnType<typeof createPrismaEdge>>;
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
		const postId = extractPostIdFromKey(event.object.key);

		// Delete events: DeleteObject, LifecycleDeletion
		if (
			event.action === "DeleteObject" ||
			event.action === "LifecycleDeletion"
		) {
			console.log(`Deleting post: ${postId}`);

			// Get post with tags before deletion
			const findPostFn = findPostById(prisma);
			const postResult = await findPostFn(postId);

			if (postResult.isErr()) {
				console.error(
					`Error finding post ${postId}:`,
					postResult.error.message,
				);
				throw postResult.error;
			}

			const tagIds = postResult.value?.tags?.map((tag) => tag.id) || [];

			const deletePostFn = deletePost(prisma);
			const result = await deletePostFn(postId);

			if (result.isErr()) {
				console.error(`Failed to delete post ${postId}:`, result.error.message);
				throw result.error;
			}

			console.log(`Successfully deleted post: ${postId}`);

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
			console.log(`Processed tags for post ${postId}:`, tagNames);

			const findPostFn = findPostById(prisma);
			const existingPostResult = await findPostFn(postId);

			if (existingPostResult.isErr()) {
				console.error(
					`Database error when checking existing post:`,
					existingPostResult.error.message,
				);
				throw existingPostResult.error;
			}

			if (existingPostResult.value) {
				console.log(`Updating existing post: ${postId}`);
				const updatePostFn = updatePost(prisma);
				const result = await updatePostFn(postId, {
					title: frontmatter.title,
					content: body,
					tagIds,
				});

				if (result.isErr()) {
					console.error(
						`Failed to update post ${postId}:`,
						result.error.message,
					);
					throw result.error;
				}

				console.log(`Successfully updated post: ${postId}`);
			} else {
				console.log(`Creating new post: ${postId}`);
				const createPostFn = createPost(prisma);
				const result = await createPostFn({
					title: frontmatter.title,
					content: body,
					tagIds,
				});

				if (result.isErr()) {
					console.error(
						`Failed to create post ${postId}:`,
						result.error.message,
					);
					throw result.error;
				}

				console.log(`Successfully created post: ${postId}`);
			}
		}
	} catch (error) {
		console.error(`Error processing R2 event for ${event.object.key}:`, error);
		throw error;
	}
};
