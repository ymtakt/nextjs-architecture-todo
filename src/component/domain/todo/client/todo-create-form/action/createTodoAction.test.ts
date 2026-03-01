import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/external/prisma";
import { createTodoAction } from "./createTodoAction";

// requireAuth のモック
const mockUser = vi.hoisted(() => ({
  id: "test-user-id",
  firebaseUid: "test-uid",
  email: "test@example.com",
}));

vi.mock("@/model/logic/auth/authLogic", () => ({
  requireAuth: vi.fn().mockResolvedValue(mockUser),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("createTodoAction", () => {
  beforeEach(async () => {
    await prisma.user.create({
      data: {
        id: mockUser.id,
        firebaseUid: mockUser.firebaseUid,
        email: mockUser.email,
      },
    });
  });

  afterEach(async () => {
    await prisma.todo.deleteMany();
    await prisma.user.deleteMany();
  });

  // 前提：有効なタイトルを渡す。
  // 期待値：新しい Todo が作成される。
  it("Todo を正常に作成できる", async () => {
    // Act
    const result = await createTodoAction({ title: "New Todo" });

    // Assert
    expect(result.success).toBe(true);
    expect(result.message).toBe("Todo を作成した.");

    const todos = await prisma.todo.findMany({ where: { userId: mockUser.id } });
    expect(todos).toHaveLength(1);
    expect(todos[0].title).toBe("New Todo");
  });

  // 前提：空のタイトルを渡す。
  // 期待値：Todo が作成される（バリデーションは呼び出し元の責務）。
  it("空のタイトルでも Todo を作成できる（バリデーションは呼び出し元の責務）", async () => {
    // Act
    const result = await createTodoAction({ title: "" });

    // Assert
    expect(result.success).toBe(true);
  });
});
