import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/external/prisma";
import { updateTodoAction } from "./updateTodoAction";

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

describe("updateTodoAction", () => {
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

  // 前提：存在する Todo のタイトルを更新する。
  // 期待値：タイトルが更新された Todo が返される。
  it("Todo のタイトルを更新できる", async () => {
    // Arrange
    const todo = await prisma.todo.create({
      data: { title: "Original", completed: false, userId: mockUser.id },
    });

    // Act
    const result = await updateTodoAction(todo.id, { title: "Updated" });

    // Assert
    expect(result.success).toBe(true);
    expect(result.message).toBe("Todo を更新した.");

    const updatedTodo = await prisma.todo.findUnique({ where: { id: todo.id } });
    expect(updatedTodo?.title).toBe("Updated");
  });

  // 前提：存在する Todo の完了状態を更新する。
  // 期待値：完了状態が更新された Todo が返される。
  it("Todo の完了状態を更新できる", async () => {
    // Arrange
    const todo = await prisma.todo.create({
      data: { title: "Test", completed: false, userId: mockUser.id },
    });

    // Act
    const result = await updateTodoAction(todo.id, { completed: true });

    // Assert
    expect(result.success).toBe(true);

    const updatedTodo = await prisma.todo.findUnique({ where: { id: todo.id } });
    expect(updatedTodo?.completed).toBe(true);
  });

  // 前提：存在する Todo のタイトルと完了状態を同時に更新する。
  // 期待値：両方が更新された Todo が返される。
  it("タイトルと完了状態を同時に更新できる", async () => {
    // Arrange
    const todo = await prisma.todo.create({
      data: { title: "Original", completed: false, userId: mockUser.id },
    });

    // Act
    const result = await updateTodoAction(todo.id, { title: "New Title", completed: true });

    // Assert
    expect(result.success).toBe(true);

    const updatedTodo = await prisma.todo.findUnique({ where: { id: todo.id } });
    expect(updatedTodo?.title).toBe("New Title");
    expect(updatedTodo?.completed).toBe(true);
  });

  // 前提：存在しない ID で更新を試みる。
  // 期待値：エラーが返される。
  it("存在しない Todo の更新は失敗する", async () => {
    // Act
    const result = await updateTodoAction("non-existent-id", { title: "Updated" });

    // Assert
    expect(result.success).toBe(false);
  });
});
