import { z } from "zod";

/** Todo 更新時の入力バリデーションスキーマ. */
export const updateTodoInputSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須である.")
    .max(100, "タイトルは 100 文字以内である必要がある."),
  completed: z.boolean(),
});

/** Todo 更新時の入力型. */
export type UpdateTodoFormInput = z.infer<typeof updateTodoInputSchema>;
