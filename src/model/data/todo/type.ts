import type { z } from "zod";

import type {
  createTodoInputSchema,
  todoSchema,
  updateTodoInputSchema,
} from "./schema";

/**
 * Todo エンティティの型.
 */
export type Todo = z.infer<typeof todoSchema>;

/**
 * Todo 作成時の入力型.
 */
export type CreateTodoInput = z.infer<typeof createTodoInputSchema>;

/**
 * Todo 更新時の入力型.
 */
export type UpdateTodoInput = z.infer<typeof updateTodoInputSchema>;
