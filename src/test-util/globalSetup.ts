import { execSync } from "node:child_process";

const TEST_DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5434/todo_test";

export async function setup() {
  try {
    console.log("🔧 Global setup: Setting up test database...");
    console.log(`🔧 Using DATABASE_URL: ${TEST_DATABASE_URL}`);

    process.env.DATABASE_URL = TEST_DATABASE_URL;

    // マイグレーション実行
    execSync("npx prisma migrate deploy", {
      stdio: "pipe",
      env: {
        ...process.env,
        DATABASE_URL: TEST_DATABASE_URL,
      },
    });

    console.log("✅ Global setup: Database migration complete");
  } catch (error) {
    console.error("❌ Global setup failed:", error);
    throw error;
  }
}

export async function teardown() {
  console.log("🧹 Global teardown complete");
}
