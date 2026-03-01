import { err, ok, ResultAsync } from "neverthrow";

import { prisma } from "@/external/prisma";
import type { CreateTodoInput, Todo, UpdateTodoInput } from "@/model/data/todo/type";

/**
 * リポジトリ層で発生するエラーの種別.
 */
export type TodoRepositoryErrorType = "NOT_FOUND" | "DATABASE_ERROR";

/**
 * リポジトリ層のエラー.
 */
export interface TodoRepositoryError {
  type: TodoRepositoryErrorType;
  message: string;
}

/**
 * Todo の永続化を担当するリポジトリ.
 * external の prisma を使用してデータベースとの通信を行う.
 */
export const todoRepository = {
  /**
   * すべての Todo を取得する.
   * @returns Todo の配列を含む ResultAsync.
   */
  findAll(): ResultAsync<Todo[], TodoRepositoryError> {
    return ResultAsync.fromPromise(
      prisma.todo.findMany({
        orderBy: { createdAt: "desc" },
      }),
      (error): TodoRepositoryError => ({
        type: "DATABASE_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    );
  },

  /**
   * 指定された ID の Todo を取得する.
   * @param id - 取得する Todo の ID.
   * @returns Todo を含む ResultAsync. 存在しない場合は NOT_FOUND エラー.
   */
  findById(id: string): ResultAsync<Todo, TodoRepositoryError> {
    return ResultAsync.fromPromise(
      prisma.todo.findUnique({ where: { id } }),
      (error): TodoRepositoryError => ({
        type: "DATABASE_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    ).andThen((todo) => {
      if (!todo) {
        return err<Todo, TodoRepositoryError>({
          type: "NOT_FOUND",
          message: `Todo with id ${id} not found`,
        });
      }
      return ok<Todo, TodoRepositoryError>(todo as Todo);
    });
  },

  /**
   * 新しい Todo を作成する.
   * @param input - 作成する Todo の入力データ.
   * @returns 作成された Todo を含む ResultAsync.
   */
  create(input: CreateTodoInput): ResultAsync<Todo, TodoRepositoryError> {
    return ResultAsync.fromPromise(
      prisma.todo.create({
        data: {
          title: input.title,
          completed: false,
        },
      }),
      (error): TodoRepositoryError => ({
        type: "DATABASE_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    );
  },

  /**
   * 指定された ID の Todo を更新する.
   * @param id - 更新する Todo の ID.
   * @param input - 更新内容.
   * @returns 更新された Todo を含む ResultAsync.
   */
  update(
    id: string,
    input: UpdateTodoInput
  ): ResultAsync<Todo, TodoRepositoryError> {
    return ResultAsync.fromPromise(
      prisma.todo.update({
        where: { id },
        data: input,
      }),
      (error): TodoRepositoryError => ({
        type: "DATABASE_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    );
  },

  /**
   * 指定された ID の Todo を削除する.
   * @param id - 削除する Todo の ID.
   * @returns 削除された Todo を含む ResultAsync.
   */
  delete(id: string): ResultAsync<Todo, TodoRepositoryError> {
    return ResultAsync.fromPromise(
      prisma.todo.delete({ where: { id } }),
      (error): TodoRepositoryError => ({
        type: "DATABASE_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    );
  },
};
