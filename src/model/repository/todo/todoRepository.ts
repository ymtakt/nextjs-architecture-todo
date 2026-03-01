"use server";

import { err, ok, type Result } from "neverthrow";

import { prisma } from "@/external/prisma";
import type { CreateTodoInput, Todo, UpdateTodoInput } from "@/model/data/todo/type";

/**
 * リポジトリ層で発生するエラーの種別.
 */
export type TodoRepositoryErrorType = "NOT_FOUND" | "DATABASE_ERROR";

/**
 * リポジトリ層のエラー.
 */
export type TodoRepositoryError = {
  type: TodoRepositoryErrorType;
  message: string;
};

type RepoResult<T> = Result<T, TodoRepositoryError>;

/**
 * エラーをリポジトリエラーに変換する.
 */
function toDbError(error: unknown): TodoRepositoryError {
  return {
    type: "DATABASE_ERROR",
    message: error instanceof Error ? error.message : "Unknown error",
  };
}

/**
 * すべての Todo を取得する.
 */
export async function findAllTodos(): Promise<RepoResult<Todo[]>> {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: { createdAt: "desc" },
    });
    return ok(todos);
  } catch (error) {
    return err(toDbError(error));
  }
}

/**
 * 指定された ID の Todo を取得する.
 */
export async function findTodoById(id: string): Promise<RepoResult<Todo>> {
  try {
    const todo = await prisma.todo.findUnique({ where: { id } });
    if (!todo) {
      return err({
        type: "NOT_FOUND",
        message: `Todo with id ${id} not found`,
      });
    }
    return ok(todo);
  } catch (error) {
    return err(toDbError(error));
  }
}

/**
 * 新しい Todo を作成する.
 */
export async function createTodo(input: CreateTodoInput): Promise<RepoResult<Todo>> {
  try {
    const todo = await prisma.todo.create({
      data: {
        title: input.title,
        completed: false,
      },
    });
    return ok(todo);
  } catch (error) {
    return err(toDbError(error));
  }
}

/**
 * 指定された ID の Todo を更新する.
 */
export async function updateTodo(
  id: string,
  input: UpdateTodoInput
): Promise<RepoResult<Todo>> {
  try {
    const todo = await prisma.todo.update({
      where: { id },
      data: input,
    });
    return ok(todo);
  } catch (error) {
    return err(toDbError(error));
  }
}

/**
 * 指定された ID の Todo を削除する.
 */
export async function deleteTodo(id: string): Promise<RepoResult<Todo>> {
  try {
    const todo = await prisma.todo.delete({ where: { id } });
    return ok(todo);
  } catch (error) {
    return err(toDbError(error));
  }
}
