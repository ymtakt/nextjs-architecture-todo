import { err, ok } from "neverthrow";
import { describe, expect, it, vi } from "vitest";

// リポジトリのモック
const mockFindAllTodos = vi.fn();
const mockFindTodoById = vi.fn();
const mockCreateTodo = vi.fn();
const mockUpdateTodo = vi.fn();
const mockDeleteTodo = vi.fn();

vi.mock("@/model/repository/todo/todoRepository", () => ({
  findAllTodos: (...args: unknown[]) => mockFindAllTodos(...args),
  findTodoById: (...args: unknown[]) => mockFindTodoById(...args),
  createTodo: (...args: unknown[]) => mockCreateTodo(...args),
  updateTodo: (...args: unknown[]) => mockUpdateTodo(...args),
  deleteTodo: (...args: unknown[]) => mockDeleteTodo(...args),
}));

// 動的インポートでモックが適用された後にロード
const { getAllTodos, createNewTodo, toggleTodoComplete } = await import(
  "@/model/logic/todo/todoLogic"
);

describe("todoLogic (repository error scenarios)", () => {
  describe("getAllTodos", () => {
    // 前提：リポジトリが DATABASE_ERROR を返す。
    // 期待値：INTERNAL_ERROR が返される。
    it("リポジトリがエラーを返した場合は INTERNAL_ERROR を返す", async () => {
      // Arrange
      mockFindAllTodos.mockResolvedValue(
        err({ type: "DATABASE_ERROR", message: "Connection failed" }),
      );

      // Act
      const result = await getAllTodos("user-id");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("INTERNAL_ERROR");
        expect(result.error.message).toBe("Connection failed");
      }
    });
  });

  describe("createNewTodo", () => {
    // 前提：リポジトリが DATABASE_ERROR を返す。
    // 期待値：INTERNAL_ERROR が返される。
    it("リポジトリがエラーを返した場合は INTERNAL_ERROR を返す", async () => {
      // Arrange
      mockCreateTodo.mockResolvedValue(err({ type: "DATABASE_ERROR", message: "Insert failed" }));

      // Act
      const result = await createNewTodo({ title: "Test" }, "user-id");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("INTERNAL_ERROR");
        expect(result.error.message).toBe("Insert failed");
      }
    });
  });

  describe("toggleTodoComplete", () => {
    // 前提：Todo 取得は成功するが、更新時にリポジトリが DATABASE_ERROR を返す。
    // 期待値：INTERNAL_ERROR が返される。
    it("updateTodo がエラーを返した場合は INTERNAL_ERROR を返す", async () => {
      // Arrange
      const mockTodo = {
        id: "todo-id",
        title: "Test",
        completed: false,
        userId: "user-id",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockFindTodoById.mockResolvedValue(ok(mockTodo));
      mockUpdateTodo.mockResolvedValue(err({ type: "DATABASE_ERROR", message: "Update failed" }));

      // Act
      const result = await toggleTodoComplete("todo-id", "user-id");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("INTERNAL_ERROR");
        expect(result.error.message).toBe("Update failed");
      }
    });
  });
});
