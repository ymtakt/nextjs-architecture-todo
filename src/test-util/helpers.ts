import { vi } from "vitest";
import { prisma } from "@/external/prisma";

/**
 * テスト用ユーザーを作成する.
 */
export async function createTestUser(overrides?: {
  id?: string;
  firebaseUid?: string;
  email?: string;
  displayName?: string;
}) {
  return prisma.user.create({
    data: {
      id: overrides?.id ?? "test-user-id",
      firebaseUid: overrides?.firebaseUid ?? "test-firebase-uid",
      email: overrides?.email ?? "test@example.com",
      displayName: overrides?.displayName ?? "Test User",
    },
  });
}

/**
 * テスト用 Todo を作成する.
 */
export async function createTestTodo(
  userId: string,
  overrides?: {
    id?: string;
    title?: string;
    completed?: boolean;
  },
) {
  return prisma.todo.create({
    data: {
      id: overrides?.id ?? "test-todo-id",
      title: overrides?.title ?? "Test Todo",
      completed: overrides?.completed ?? false,
      userId,
    },
  });
}

/**
 * Firebase Admin モックの verifySessionCookie の戻り値を設定する.
 */
export function mockVerifySessionCookie(
  firebaseAdminAuth: { verifySessionCookie: ReturnType<typeof vi.fn> },
  uid: string,
  email = "test@example.com",
) {
  firebaseAdminAuth.verifySessionCookie.mockResolvedValue({ uid, email });
}

/**
 * Next.js cookies モックの戻り値を設定する.
 */
export function mockCookies(cookies: ReturnType<typeof vi.fn>, sessionCookie: string | null) {
  cookies.mockReturnValue({
    get: sessionCookie ? () => ({ value: sessionCookie }) : () => undefined,
    set: vi.fn(),
    delete: vi.fn(),
  });
}
