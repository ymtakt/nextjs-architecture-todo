import { afterEach, beforeAll, vi } from "vitest";

// Firebase Admin SDK のモック
vi.mock("@/external/firebase/admin", () => ({
  firebaseAdminAuth: {
    createSessionCookie: vi.fn().mockResolvedValue("mock-session-cookie"),
    verifySessionCookie: vi.fn().mockResolvedValue({
      uid: "test-firebase-uid",
      email: "test@example.com",
    }),
  },
}));

// Next.js cookies のモック
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockReturnValue({
    get: vi.fn().mockReturnValue({ value: "mock-session-cookie" }),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

// Next.js redirect のモック
vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

// Next.js revalidatePath のモック
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Logger のモック
vi.mock("@/external/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

beforeAll(async () => {
  console.log("🌱 Test setup: Preparing test environment...");
});

afterEach(async () => {
  // モックをリセット（DBクリーンアップは各テストファイルで行う）
  vi.clearAllMocks();
});
