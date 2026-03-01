"use server";

import { err, ok, type Result } from "neverthrow";

import { prisma } from "@/external/prisma";
import type { CreateTodoInput, Todo, UpdateTodoInput } from "@/model/data/todo/type";

/** リポジトリ層のエラー. */
export type RepositoryError = {
  type: "NOT_FOUND" | "DATABASE_ERROR";
  message: string;
};

type RepositoryResult<T> = Result<T, RepositoryError>;

/**
 * すべての Todo を取得する.
 */
export async function findAllTodos(): Promise<RepositoryResult<Todo[]>> {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: { createdAt: "desc" },
    });
    return ok(todos);
  } catch (e) {
    return err({ type: "DATABASE_ERROR", message: e instanceof Error ? e.message : "Unknown error" });
  }
}

/**
 * 指定された ID の Todo を取得する.
 */
export async function findTodoById(id: string): Promise<RepositoryResult<Todo>> {
  try {
    const todo = await prisma.todo.findUnique({ where: { id } });
    if (!todo) {
      return err({ type: "NOT_FOUND", message: `Todo with id ${id} not found` });
    }
    return ok(todo);
  } catch (e) {
    return err({ type: "DATABASE_ERROR", message: e instanceof Error ? e.message : "Unknown error" });
  }
}

/**
 * 新しい Todo を作成する.
 */
export async function createTodo(input: CreateTodoInput): Promise<RepositoryResult<Todo>> {
  try {
    const todo = await prisma.todo.create({
      data: {
        title: input.title,
        completed: false,
      },
    });
    return ok(todo);
  } catch (e) {
    return err({ type: "DATABASE_ERROR", message: e instanceof Error ? e.message : "Unknown error" });
  }
}

/**
 * 指定された ID の Todo を更新する.
 */
export async function updateTodo(
  id: string,
  input: UpdateTodoInput
): Promise<RepositoryResult<Todo>> {
  try {
    const todo = await prisma.todo.update({
      where: { id },
      data: input,
    });
    return ok(todo);
  } catch (e) {
    return err({ type: "DATABASE_ERROR", message: e instanceof Error ? e.message : "Unknown error" });
  }
}

/**
 * 指定された ID の Todo を削除する.
 */
export async function deleteTodo(id: string): Promise<RepositoryResult<Todo>> {
  try {
    const todo = await prisma.todo.delete({ where: { id } });
    return ok(todo);
  } catch (e) {
    return err({ type: "DATABASE_ERROR", message: e instanceof Error ? e.message : "Unknown error" });
  }
}
