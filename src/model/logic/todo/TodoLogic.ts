import { ResultAsync } from "neverthrow";
import { match } from "ts-pattern";

import { logger } from "@/external/logger";
import type { CreateTodoInput, Todo, UpdateTodoInput } from "@/model/data/todo/type";
import {
  todoRepository,
  type TodoRepositoryError,
} from "@/model/repository/todo/TodoRepository";

/**
 * サービス層で発生するエラーの種別.
 */
export type TodoServiceErrorType = "NOT_FOUND" | "VALIDATION_ERROR" | "INTERNAL_ERROR";

/**
 * サービス層のエラー.
 */
export interface TodoServiceError {
  type: TodoServiceErrorType;
  message: string;
}

/**
 * リポジトリエラーをサービスエラーに変換する.
 * @param error - リポジトリエラー.
 * @returns サービスエラー.
 */
const mapRepositoryError = (error: TodoRepositoryError): TodoServiceError => {
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
};

/**
 * Todo に関するビジネスロジックを提供するサービス.
 * repository を使用してデータの永続化を行う.
 */
export const todoService = {
  /**
   * すべての Todo を取得する.
   * @returns Todo の配列を含む ResultAsync.
   */
  getAll(): ResultAsync<Todo[], TodoServiceError> {
    logger.info("Fetching all todos");
    return todoRepository.findAll().mapErr(mapRepositoryError);
  },

  /**
   * 指定された ID の Todo を取得する.
   * @param id - 取得する Todo の ID.
   * @returns Todo を含む ResultAsync.
   */
  getById(id: string): ResultAsync<Todo, TodoServiceError> {
    logger.info({ id }, "Fetching todo by id");
    return todoRepository.findById(id).mapErr(mapRepositoryError);
  },

  /**
   * 新しい Todo を作成する.
   * @param input - 作成する Todo の入力データ.
   * @returns 作成された Todo を含む ResultAsync.
   */
  create(input: CreateTodoInput): ResultAsync<Todo, TodoServiceError> {
    logger.info({ input }, "Creating new todo");
    return todoRepository.create(input).mapErr(mapRepositoryError);
  },

  /**
   * 指定された ID の Todo を更新する.
   * @param id - 更新する Todo の ID.
   * @param input - 更新内容.
   * @returns 更新された Todo を含む ResultAsync.
   */
  update(id: string, input: UpdateTodoInput): ResultAsync<Todo, TodoServiceError> {
    logger.info({ id, input }, "Updating todo");
    return todoRepository.update(id, input).mapErr(mapRepositoryError);
  },

  /**
   * 指定された ID の Todo を削除する.
   * @param id - 削除する Todo の ID.
   * @returns 削除された Todo を含む ResultAsync.
   */
  delete(id: string): ResultAsync<Todo, TodoServiceError> {
    logger.info({ id }, "Deleting todo");
    return todoRepository.delete(id).mapErr(mapRepositoryError);
  },

  /**
   * Todo の完了状態を切り替える.
   * @param id - 対象の Todo の ID.
   * @returns 更新された Todo を含む ResultAsync.
   */
  toggleComplete(id: string): ResultAsync<Todo, TodoServiceError> {
    logger.info({ id }, "Toggling todo completion");
    return todoRepository
      .findById(id)
      .mapErr(mapRepositoryError)
      .andThen((todo) =>
        todoRepository
          .update(id, { completed: !todo.completed })
          .mapErr(mapRepositoryError)
      );
  },
};
