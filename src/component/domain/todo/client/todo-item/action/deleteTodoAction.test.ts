import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/external/prisma";
import { deleteTodoAction } from "./deleteTodoAction";

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

describe("deleteTodoAction", () => {
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

  // 前提：存在する Todo を削除する。
  // 期待値：Todo が削除される。
  it("Todo を正常に削除できる", async () => {
    // Arrange
    const todo = await prisma.todo.create({
      data: { title: "To Delete", completed: false, userId: mockUser.id },
    });

    // Act
    const result = await deleteTodoAction(todo.id);

    // Assert
    expect(result.success).toBe(true);
    expect(result.message).toBe("Todo を削除した.");

    const deletedTodo = await prisma.todo.findUnique({ where: { id: todo.id } });
    expect(deletedTodo).toBeNull();
  });

  // 前提：存在しない ID で削除を試みる。
  // 期待値：エラーが返される。
  it("存在しない Todo の削除は失敗する", async () => {
    // Act
    const result = await deleteTodoAction("non-existent-id");

    // Assert
    expect(result.success).toBe(false);
  });
});
