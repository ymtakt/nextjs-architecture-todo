"use server";

import { err, ok, type Result } from "neverthrow";

import { logger } from "@/external/logger";
import type { CreateTodoInput, Todo, UpdateTodoInput } from "@/model/data/todo/type";
import {
  createTodo,
  deleteTodo,
  findAllTodos,
  findTodoById,
  updateTodo,
  type RepositoryError,
} from "@/model/repository/todo/todoRepository";

/** サービス層のエラー. */
type ServiceError = {
  type: "NOT_FOUND" | "INTERNAL_ERROR";
  message: string;
};

type ServiceResult<T> = Result<T, ServiceError>;

/** リポジトリエラーをサービスエラーに変換する. */
function toServiceError(e: RepositoryError): ServiceError {
  return {
    type: e.type === "NOT_FOUND" ? "NOT_FOUND" : "INTERNAL_ERROR",
    message: e.message,
  };
}

/**
 * 指定ユーザーのすべての Todo を取得する.
 */
export async function getAllTodos(userId: string): Promise<ServiceResult<Todo[]>> {
  logger.info({ userId }, "Fetching all todos");
  const result = await findAllTodos(userId);
  if (result.isErr()) {
    return err(toServiceError(result.error));
  }
  return ok(result.value);
}

/**
 * 指定された ID の Todo を取得する.
 */
export async function getTodoById(id: string, userId: string): Promise<ServiceResult<Todo>> {
  logger.info({ id, userId }, "Fetching todo by id");
  const result = await findTodoById(id, userId);
  if (result.isErr()) {
    return err(toServiceError(result.error));
  }
  return ok(result.value);
}

/**
 * 新しい Todo を作成する.
 */
export async function createNewTodo(input: CreateTodoInput, userId: string): Promise<ServiceResult<Todo>> {
  logger.info({ input, userId }, "Creating new todo");
  const result = await createTodo(input, userId);
  if (result.isErr()) {
    return err(toServiceError(result.error));
  }
  return ok(result.value);
}

/**
 * 指定された ID の Todo を更新する.
 */
export async function updateTodoById(
  id: string,
  input: UpdateTodoInput,
  userId: string
): Promise<ServiceResult<Todo>> {
  logger.info({ id, input, userId }, "Updating todo");
  const result = await updateTodo(id, input, userId);
  if (result.isErr()) {
    return err(toServiceError(result.error));
  }
  return ok(result.value);
}

/**
 * 指定された ID の Todo を削除する.
 */
export async function deleteTodoById(id: string, userId: string): Promise<ServiceResult<Todo>> {
  logger.info({ id, userId }, "Deleting todo");
  const result = await deleteTodo(id, userId);
  if (result.isErr()) {
    return err(toServiceError(result.error));
  }
  return ok(result.value);
}

/**
 * Todo の完了状態を切り替える.
 */
export async function toggleTodoComplete(id: string, userId: string): Promise<ServiceResult<Todo>> {
  logger.info({ id, userId }, "Toggling todo completion");

  const findResult = await findTodoById(id, userId);
  if (findResult.isErr()) {
    return err(toServiceError(findResult.error));
  }

  const todo = findResult.value;
  const updateResult = await updateTodo(id, { completed: !todo.completed }, userId);
  if (updateResult.isErr()) {
    return err(toServiceError(updateResult.error));
  }

  return ok(updateResult.value);
}
