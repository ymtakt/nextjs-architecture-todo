import { err } from "neverthrow";
import { describe, expect, it, vi } from "vitest";

// requireAuth のモック
const mockUser = vi.hoisted(() => ({
  id: "test-user-id",
  firebaseUid: "test-uid",
  email: "test@example.com",
}));

const mockCreateNewTodo = vi.fn();

vi.mock("@/model/logic/auth/authLogic", () => ({
  requireAuth: vi.fn().mockResolvedValue(mockUser),
}));

vi.mock("@/model/logic/todo/todoLogic", () => ({
  createNewTodo: (...args: unknown[]) => mockCreateNewTodo(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// 動的インポートでモックが適用された後にロード
const { createTodoAction } = await import("./createTodoAction");

describe("createTodoAction (error scenarios)", () => {
  // 前提：Todo 作成時に内部エラーが発生する。
  // 期待値：エラーが返される。
  it("Todo 作成に失敗した場合はエラーを返す", async () => {
    // Arrange
    mockCreateNewTodo.mockResolvedValue(err({ type: "INTERNAL_ERROR", message: "Database error" }));

    // Act
    const result = await createTodoAction({ title: "Test" });

    // Assert
    expect(result.success).toBe(false);
    expect(result.message).toBe("Database error");
  });
});
