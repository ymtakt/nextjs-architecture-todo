import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/external/prisma";
import {
  createNewTodo,
  deleteTodoById,
  getAllTodos,
  getTodoById,
  toggleTodoComplete,
  updateTodoById,
} from "@/model/logic/todo/todoLogic";

describe("todoLogic", () => {
  const testUserId = "test-user-id";

  beforeEach(async () => {
    // テスト用ユーザーを作成
    await prisma.user.create({
      data: {
        id: testUserId,
        firebaseUid: "test-firebase-uid",
        email: "test@example.com",
        displayName: "Test User",
      },
    });
  });

  afterEach(async () => {
    // 各テスト後にクリーンアップ
    await prisma.todo.deleteMany();
    await prisma.user.deleteMany();
  });

  describe("getAllTodos", () => {
    // 前提：ユーザーが複数の Todo を持っている。
    // 期待値：すべての Todo が取得できる。
    it("ユーザーの全ての Todo を取得できる", async () => {
      // Arrange
      await prisma.todo.createMany({
        data: [
          { title: "Todo 1", completed: false, userId: testUserId },
          { title: "Todo 2", completed: true, userId: testUserId },
        ],
      });

      // Act
      const result = await getAllTodos(testUserId);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
      }
    });

    // 前提：ユーザーが Todo を持っていない。
    // 期待値：空配列が返される。
    it("Todo が存在しない場合は空配列を返す", async () => {
      // Act
      const result = await getAllTodos(testUserId);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(0);
      }
    });
  });

  describe("getTodoById", () => {
    // 前提：指定した ID の Todo が存在する。
    // 期待値：その Todo が取得できる。
    it("指定した ID の Todo を取得できる", async () => {
      // Arrange
      const todo = await prisma.todo.create({
        data: { title: "Test Todo", completed: false, userId: testUserId },
      });

      // Act
      const result = await getTodoById(todo.id, testUserId);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe("Test Todo");
      }
    });

    // 前提：指定した ID の Todo が存在しない。
    // 期待値：NOT_FOUND エラーが返される。
    it("存在しない ID の場合は NOT_FOUND エラーを返す", async () => {
      // Act
      const result = await getTodoById("non-existent-id", testUserId);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("NOT_FOUND");
      }
    });

    // 前提：指定した ID の Todo が他のユーザーのものである。
    // 期待値：NOT_FOUND エラーが返される（アクセス不可）。
    it("他のユーザーの Todo にはアクセスできない", async () => {
      // Arrange
      const otherUserId = "other-user-id";
      await prisma.user.create({
        data: {
          id: otherUserId,
          firebaseUid: "other-firebase-uid",
          email: "other@example.com",
        },
      });
      const todo = await prisma.todo.create({
        data: { title: "Other Todo", completed: false, userId: otherUserId },
      });

      // Act
      const result = await getTodoById(todo.id, testUserId);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("NOT_FOUND");
      }
    });
  });

  describe("createNewTodo", () => {
    // 前提：有効なタイトルを渡す。
    // 期待値：新しい Todo が作成される。
    it("新しい Todo を作成できる", async () => {
      // Act
      const result = await createNewTodo({ title: "New Todo" }, testUserId);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe("New Todo");
        expect(result.value.completed).toBe(false);
        expect(result.value.userId).toBe(testUserId);
      }
    });
  });

  describe("updateTodoById", () => {
    // 前提：存在する Todo のタイトルを更新する。
    // 期待値：タイトルが更新された Todo が返される。
    it("Todo のタイトルを更新できる", async () => {
      // Arrange
      const todo = await prisma.todo.create({
        data: { title: "Original", completed: false, userId: testUserId },
      });

      // Act
      const result = await updateTodoById(todo.id, { title: "Updated" }, testUserId);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe("Updated");
      }
    });

    // 前提：存在する Todo の完了状態を更新する。
    // 期待値：完了状態が更新された Todo が返される。
    it("Todo の完了状態を更新できる", async () => {
      // Arrange
      const todo = await prisma.todo.create({
        data: { title: "Test", completed: false, userId: testUserId },
      });

      // Act
      const result = await updateTodoById(todo.id, { completed: true }, testUserId);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.completed).toBe(true);
      }
    });

    // 前提：存在しない ID で更新を試みる。
    // 期待値：NOT_FOUND エラーが返される。
    it("存在しない Todo の更新は NOT_FOUND エラーを返す", async () => {
      // Act
      const result = await updateTodoById("non-existent-id", { title: "Updated" }, testUserId);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("NOT_FOUND");
      }
    });

    // 前提：他のユーザーの Todo を更新しようとする。
    // 期待値：NOT_FOUND エラーが返される（更新不可）。
    it("他のユーザーの Todo は更新できない", async () => {
      // Arrange
      const otherUserId = "other-user-id";
      await prisma.user.create({
        data: {
          id: otherUserId,
          firebaseUid: "other-firebase-uid",
          email: "other@example.com",
        },
      });
      const todo = await prisma.todo.create({
        data: { title: "Other Todo", completed: false, userId: otherUserId },
      });

      // Act
      const result = await updateTodoById(todo.id, { title: "Hacked" }, testUserId);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("NOT_FOUND");
      }
    });
  });

  describe("deleteTodoById", () => {
    // 前提：存在する Todo を削除する。
    // 期待値：Todo が削除される。
    it("Todo を削除できる", async () => {
      // Arrange
      const todo = await prisma.todo.create({
        data: { title: "To Delete", completed: false, userId: testUserId },
      });

      // Act
      const result = await deleteTodoById(todo.id, testUserId);

      // Assert
      expect(result.isOk()).toBe(true);
      const deletedTodo = await prisma.todo.findUnique({ where: { id: todo.id } });
      expect(deletedTodo).toBeNull();
    });

    // 前提：存在しない ID で削除を試みる。
    // 期待値：NOT_FOUND エラーが返される。
    it("存在しない Todo の削除は NOT_FOUND エラーを返す", async () => {
      // Act
      const result = await deleteTodoById("non-existent-id", testUserId);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("NOT_FOUND");
      }
    });

    // 前提：他のユーザーの Todo を削除しようとする。
    // 期待値：NOT_FOUND エラーが返される（削除不可）。
    it("他のユーザーの Todo は削除できない", async () => {
      // Arrange
      const otherUserId = "other-user-id";
      await prisma.user.create({
        data: {
          id: otherUserId,
          firebaseUid: "other-firebase-uid",
          email: "other@example.com",
        },
      });
      const todo = await prisma.todo.create({
        data: { title: "Other Todo", completed: false, userId: otherUserId },
      });

      // Act
      const result = await deleteTodoById(todo.id, testUserId);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("NOT_FOUND");
      }
    });
  });

  describe("toggleTodoComplete", () => {
    // 前提：未完了の Todo を切り替える。
    // 期待値：完了状態になる。
    it("未完了の Todo を完了にできる", async () => {
      // Arrange
      const todo = await prisma.todo.create({
        data: { title: "Test", completed: false, userId: testUserId },
      });

      // Act
      const result = await toggleTodoComplete(todo.id, testUserId);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.completed).toBe(true);
      }
    });

    // 前提：完了の Todo を切り替える。
    // 期待値：未完了状態になる。
    it("完了の Todo を未完了にできる", async () => {
      // Arrange
      const todo = await prisma.todo.create({
        data: { title: "Test", completed: true, userId: testUserId },
      });

      // Act
      const result = await toggleTodoComplete(todo.id, testUserId);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.completed).toBe(false);
      }
    });

    // 前提：存在しない ID で切り替えを試みる。
    // 期待値：NOT_FOUND エラーが返される。
    it("存在しない Todo の切り替えは NOT_FOUND エラーを返す", async () => {
      // Act
      const result = await toggleTodoComplete("non-existent-id", testUserId);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("NOT_FOUND");
      }
    });
  });
});
