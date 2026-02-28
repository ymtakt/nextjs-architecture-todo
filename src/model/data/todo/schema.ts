import { z } from "zod";

/**
 * Todo の ID を表すスキーマ.
 */
export const todoIdSchema = z.string().cuid();

/**
 * Todo のタイトルを表すスキーマ.
 */
export const todoTitleSchema = z
  .string()
  .min(1, "タイトルは必須である.")
  .max(100, "タイトルは 100 文字以内である必要がある.");

/**
 * Todo エンティティのスキーマ.
 */
export const todoSchema = z.object({
  id: todoIdSchema,
  title: todoTitleSchema,
  completed: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Todo 作成時の入力スキーマ.
 */
export const createTodoInputSchema = z.object({
  title: todoTitleSchema,
});

/**
 * Todo 更新時の入力スキーマ.
 */
export const updateTodoInputSchema = z.object({
  title: todoTitleSchema.optional(),
  completed: z.boolean().optional(),
});
