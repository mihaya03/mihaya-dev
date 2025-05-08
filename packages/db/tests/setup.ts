import { afterAll, beforeAll, afterEach } from "vitest";
import { createPrisma } from "../src/config/prisma.js";
import type { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

let prisma: PrismaClient;

// Set NODE_ENV to test and load test environment explicitly
process.env.NODE_ENV = "test";

// Load .env.test only in local development (not in CI)
if (!process.env.CI) {
  config({ path: ".env.test", override: true });
}

beforeAll(async () => {
  // Pass DATABASE_URL from environment to createPrisma
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required for tests. Make sure .env.test contains DATABASE_URL.",
    );
  }
  prisma = createPrisma(databaseUrl);

  // Run migrations to ensure test database has correct schema
  const { execSync } = await import("child_process");
  try {
    execSync("npx prisma migrate deploy", {
      env: { ...process.env, NODE_ENV: "test" },
      stdio: "inherit",
    });
  } catch (error) {
    console.warn("Migration failed, continuing with tests:", error);
  }
});

afterEach(async () => {
  // Clean up test data after each test
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
