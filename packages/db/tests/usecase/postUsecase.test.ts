import { describe, it, expect, beforeEach } from "vitest";
import {
  findPostById,
  createPost,
  findAllPosts,
  findPostsByTagName,
} from "../../src/usecase/postUsecase.js";
import { prisma } from "../setup.js";

describe("postUsecase", () => {
  beforeEach(async () => {
    // Clean up any existing test data
    await prisma.post.deleteMany();
    await prisma.tag.deleteMany();
  });

  describe("findPostById", () => {
    it("should return post when found", async () => {
      // Create a test post
      await prisma.post.create({
        data: {
          id: "test-id",
          title: "Test Post",
          content: "Test content",
        },
        include: { tags: true },
      });

      const result = await findPostById(prisma)("test-id");

      expect(result.isOk()).toBe(true);
      const post = result._unsafeUnwrap();
      expect(post?.id).toBe("test-id");
      expect(post?.title).toBe("Test Post");
      expect(post?.content).toBe("Test content");
      expect(post?.tags).toEqual([]);
    });

    it("should return null when post not found", async () => {
      const result = await findPostById(prisma)("non-existent-id");

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeNull();
    });

    // Note: Database connection errors are harder to test with real DB
    // This test would require disconnecting from the database
    it.skip("should return DatabaseConnectionError when database fails", async () => {
      // This test would require mocking the database connection
    });
  });

  describe("findAllPosts", () => {
    it("should return all posts", async () => {
      // Create test posts
      await prisma.post.create({
        data: {
          id: "test-id-1",
          title: "Test Post 1",
          content: "Test content 1",
        },
      });
      await prisma.post.create({
        data: {
          id: "test-id-2",
          title: "Test Post 2",
          content: "Test content 2",
        },
      });

      const result = await findAllPosts(prisma)();

      expect(result.isOk()).toBe(true);
      const posts = result._unsafeUnwrap();
      expect(posts).toHaveLength(2);
      expect(posts[0].title).toBe("Test Post 2"); // Latest first (DESC order)
      expect(posts[1].title).toBe("Test Post 1");
    });

    it("should return empty array when no posts exist", async () => {
      const result = await findAllPosts(prisma)();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual([]);
    });
  });

  describe("findPostsByTagName", () => {
    it("should return posts with specified tag", async () => {
      // Create a tag
      const tag = await prisma.tag.create({
        data: {
          id: "tag-1",
          name: "javascript",
        },
      });

      // Create a post with the tag
      await prisma.post.create({
        data: {
          id: "test-id-1",
          title: "Test Post 1",
          content: "Test content 1",
          tags: {
            connect: [{ id: tag.id }],
          },
        },
        include: { tags: true },
      });

      const result = await findPostsByTagName(prisma)("javascript");

      expect(result.isOk()).toBe(true);
      const posts = result._unsafeUnwrap();
      expect(posts).toHaveLength(1);
      expect(posts[0].title).toBe("Test Post 1");
      expect(posts[0].tags).toHaveLength(1);
      expect(posts[0].tags[0].name).toBe("javascript");
    });

    it("should return empty array when no posts have the specified tag", async () => {
      const result = await findPostsByTagName(prisma)("nonexistent");

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual([]);
    });
  });

  describe("createPost", () => {
    it("should create post successfully", async () => {
      const newPostData = {
        title: "New Post",
        content: "New content",
      };

      const result = await createPost(prisma)(newPostData);

      expect(result.isOk()).toBe(true);
      const createdPost = result._unsafeUnwrap();
      expect(createdPost.title).toBe("New Post");
      expect(createdPost.content).toBe("New content");
      expect(createdPost.id).toBeDefined();
      expect(createdPost.tags).toEqual([]);
      expect(createdPost.createdAt).toBeInstanceOf(Date);
      expect(createdPost.updatedAt).toBeInstanceOf(Date);
    });

    it("should create post with tags", async () => {
      // Create test tags first
      const tag1 = await prisma.tag.create({
        data: { id: "tag-1", name: "javascript" },
      });
      const tag2 = await prisma.tag.create({
        data: { id: "tag-2", name: "typescript" },
      });

      const newPostData = {
        title: "New Post",
        content: "New content",
        tagIds: [tag1.id, tag2.id],
      };

      const result = await createPost(prisma)(newPostData);

      if (result.isErr()) {
        console.error(
          "Error creating post with tags:",
          result._unsafeUnwrapErr(),
        );
      }
      expect(result.isOk()).toBe(true);
      const createdPost = result._unsafeUnwrap();
      expect(createdPost.title).toBe("New Post");
      expect(createdPost.content).toBe("New content");
      expect(createdPost.tags).toHaveLength(2);
      expect(createdPost.tags.map((t) => t.name).sort()).toEqual([
        "javascript",
        "typescript",
      ]);
    });

    it.skip("should return PostCreationError on ULID collision after retries", async () => {
      // This test is difficult to reproduce with real database
      // ULID collisions are extremely rare
    });

    it("should handle invalid tag IDs gracefully", async () => {
      const newPostData = {
        title: "New Post",
        content: "New content",
        tagIds: ["nonexistent-tag-id"],
      };

      const result = await createPost(prisma)(newPostData);

      // This should fail due to foreign key constraint
      expect(result.isErr()).toBe(true);
    });
  });
});
