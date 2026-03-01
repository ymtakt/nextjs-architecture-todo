import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/external/prisma";
import { toggleTodoAction } from "./toggleTodoAction";

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

describe("toggleTodoAction", () => {
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

  // 前提：未完了の Todo を切り替える。
  // 期待値：完了状態になる。
  it("未完了の Todo を完了に切り替えできる", async () => {
    // Arrange
    const todo = await prisma.todo.create({
      data: { title: "Test", completed: false, userId: mockUser.id },
    });

    // Act
    const result = await toggleTodoAction(todo.id);

    // Assert
    expect(result.success).toBe(true);
    expect(result.message).toBe("Todo の状態を更新した.");

    const updatedTodo = await prisma.todo.findUnique({ where: { id: todo.id } });
    expect(updatedTodo?.completed).toBe(true);
  });

  // 前提：完了の Todo を切り替える。
  // 期待値：未完了状態になる。
  it("完了の Todo を未完了に切り替えできる", async () => {
    // Arrange
    const todo = await prisma.todo.create({
      data: { title: "Test", completed: true, userId: mockUser.id },
    });

    // Act
    const result = await toggleTodoAction(todo.id);

    // Assert
    expect(result.success).toBe(true);

    const updatedTodo = await prisma.todo.findUnique({ where: { id: todo.id } });
    expect(updatedTodo?.completed).toBe(false);
  });

  // 前提：存在しない ID で切り替えを試みる。
  // 期待値：エラーが返される。
  it("存在しない Todo の切り替えは失敗する", async () => {
    // Act
    const result = await toggleTodoAction("non-existent-id");

    // Assert
    expect(result.success).toBe(false);
  });
});
