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
 * 指定ユーザーのすべての Todo を取得する.
 */
export async function findAllTodos(userId: string): Promise<RepositoryResult<Todo[]>> {
  try {
    const todos = await prisma.todo.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return ok(todos);
  } catch (e) {
    return err({
      type: "DATABASE_ERROR",
      message: e instanceof Error ? e.message : "Unknown error",
    });
  }
}

/**
 * 指定された ID の Todo を取得する（ユーザー確認付き）.
 */
export async function findTodoById(id: string, userId: string): Promise<RepositoryResult<Todo>> {
  try {
    const todo = await prisma.todo.findUnique({ where: { id } });
    if (!todo) {
      return err({ type: "NOT_FOUND", message: `Todo with id ${id} not found` });
    }
    // 他ユーザーの Todo にはアクセス不可
    if (todo.userId !== userId) {
      return err({ type: "NOT_FOUND", message: `Todo with id ${id} not found` });
    }
    return ok(todo);
  } catch (e) {
    return err({
      type: "DATABASE_ERROR",
      message: e instanceof Error ? e.message : "Unknown error",
    });
  }
}

/**
 * 新しい Todo を作成する.
 */
export async function createTodo(
  input: CreateTodoInput,
  userId: string,
): Promise<RepositoryResult<Todo>> {
  try {
    const todo = await prisma.todo.create({
      data: {
        title: input.title,
        completed: false,
        userId,
      },
    });
    return ok(todo);
  } catch (e) {
    return err({
      type: "DATABASE_ERROR",
      message: e instanceof Error ? e.message : "Unknown error",
    });
  }
}

/**
 * 指定された ID の Todo を更新する（ユーザー確認付き）.
 */
export async function updateTodo(
  id: string,
  input: UpdateTodoInput,
  userId: string,
): Promise<RepositoryResult<Todo>> {
  try {
    // まず所有権を確認
    const existing = await prisma.todo.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return err({ type: "NOT_FOUND", message: `Todo with id ${id} not found` });
    }

    const todo = await prisma.todo.update({
      where: { id },
      data: input,
    });
    return ok(todo);
  } catch (e) {
    return err({
      type: "DATABASE_ERROR",
      message: e instanceof Error ? e.message : "Unknown error",
    });
  }
}

/**
 * 指定された ID の Todo を削除する（ユーザー確認付き）.
 */
export async function deleteTodo(id: string, userId: string): Promise<RepositoryResult<Todo>> {
  try {
    // まず所有権を確認
    const existing = await prisma.todo.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return err({ type: "NOT_FOUND", message: `Todo with id ${id} not found` });
    }

    const todo = await prisma.todo.delete({ where: { id } });
    return ok(todo);
  } catch (e) {
    return err({
      type: "DATABASE_ERROR",
      message: e instanceof Error ? e.message : "Unknown error",
    });
  }
}
