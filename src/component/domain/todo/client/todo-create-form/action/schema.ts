import { z } from "zod";

/** Todo 作成時の入力バリデーションスキーマ. */
export const createTodoInputSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須である.")
    .max(100, "タイトルは 100 文字以内である必要がある."),
});
