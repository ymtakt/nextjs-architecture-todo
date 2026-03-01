"use server";

import { err, ok, type Result } from "neverthrow";
import { match } from "ts-pattern";

import { logger } from "@/external/logger";
import type { CreateTodoInput, Todo, UpdateTodoInput } from "@/model/data/todo/type";
import {
  createTodo,
  deleteTodo,
  findAllTodos,
  findTodoById,
  updateTodo,
  type TodoRepositoryError,
} from "@/model/repository/todo/todoRepository";

/**
 * サービス層で発生するエラーの種別.
 */
type TodoServiceErrorType = "NOT_FOUND" | "VALIDATION_ERROR" | "INTERNAL_ERROR";

/**
 * サービス層のエラー.
 */
type TodoServiceError = {
  type: TodoServiceErrorType;
  message: string;
};

type ServiceResult<T> = Result<T, TodoServiceError>;

/**
 * リポジトリエラーをサービスエラーに変換する.
 */
function mapRepositoryError(error: TodoRepositoryError): TodoServiceError {
  return match(error.type)
    .with("NOT_FOUND", () => ({
      type: "NOT_FOUND" as const,
      message: error.message,
    }))
    .with("DATABASE_ERROR", () => ({
      type: "INTERNAL_ERROR" as const,
      message: "データベースエラーが発生した.",
    }))
    .exhaustive();
}

/**
 * すべての Todo を取得する.
 */
export async function getAllTodos(): Promise<ServiceResult<Todo[]>> {
  logger.info("Fetching all todos");
  const result = await findAllTodos();
  if (result.isErr()) {
    return err(mapRepositoryError(result.error));
  }
  return ok(result.value);
}

/**
 * 指定された ID の Todo を取得する.
 */
export async function getTodoById(id: string): Promise<ServiceResult<Todo>> {
  logger.info({ id }, "Fetching todo by id");
  const result = await findTodoById(id);
  if (result.isErr()) {
    return err(mapRepositoryError(result.error));
  }
  return ok(result.value);
}

/**
 * 新しい Todo を作成する.
 */
export async function createNewTodo(input: CreateTodoInput): Promise<ServiceResult<Todo>> {
  logger.info({ input }, "Creating new todo");
  const result = await createTodo(input);
  if (result.isErr()) {
    return err(mapRepositoryError(result.error));
  }
  return ok(result.value);
}

/**
 * 指定された ID の Todo を更新する.
 */
export async function updateTodoById(
  id: string,
  input: UpdateTodoInput
): Promise<ServiceResult<Todo>> {
  logger.info({ id, input }, "Updating todo");
  const result = await updateTodo(id, input);
  if (result.isErr()) {
    return err(mapRepositoryError(result.error));
  }
  return ok(result.value);
}

/**
 * 指定された ID の Todo を削除する.
 */
export async function deleteTodoById(id: string): Promise<ServiceResult<Todo>> {
  logger.info({ id }, "Deleting todo");
  const result = await deleteTodo(id);
  if (result.isErr()) {
    return err(mapRepositoryError(result.error));
  }
  return ok(result.value);
}

/**
 * Todo の完了状態を切り替える.
 */
export async function toggleTodoComplete(id: string): Promise<ServiceResult<Todo>> {
  logger.info({ id }, "Toggling todo completion");

  const findResult = await findTodoById(id);
  if (findResult.isErr()) {
    return err(mapRepositoryError(findResult.error));
  }

  const todo = findResult.value;
  const updateResult = await updateTodo(id, { completed: !todo.completed });
  if (updateResult.isErr()) {
    return err(mapRepositoryError(updateResult.error));
  }

  return ok(updateResult.value);
}
