import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * グローバルスコープで Prisma クライアントを保持するための型定義.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma クライアントを作成する.
 * Prisma 7 では PostgreSQL アダプターを使用する.
 * @returns 新しい PrismaClient インスタンス.
 */
const createPrismaClient = () => {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
};

/**
 * Prisma クライアントのシングルトンインスタンス.
 * 開発環境ではホットリロード時の接続プール枯渇を防ぐためグローバルに保持する.
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
