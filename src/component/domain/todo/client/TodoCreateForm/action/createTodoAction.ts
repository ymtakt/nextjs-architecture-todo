"use server";

import { revalidatePath } from "next/cache";

import { createTodoInputSchema } from "@/model/data/todo/schema";
import { todoService } from "@/model/logic/todo/TodoLogic";

import type { ActionState } from "../../type";

/**
 * 新しい Todo を作成する Server Action.
 * @param _prevState - 前回の状態.
 * @param formData - フォームデータ.
 * @returns アクションの結果.
 */
export async function createTodoAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawData = {
    title: formData.get("title"),
  };

  // バリデーション.
  const parsed = createTodoInputSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message: "バリデーションエラー.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // サービス層でビジネスロジックを実行.
  const result = await todoService.create(parsed.data);

  if (result.isErr()) {
    return {
      success: false,
      message: result.error.message,
    };
  }

  revalidatePath("/todo");
  return {
    success: true,
    message: "Todo を作成した.",
  };
}
