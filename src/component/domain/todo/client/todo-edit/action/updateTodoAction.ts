"use server";

import { revalidatePath } from "next/cache";

import { updateTodoInputSchema } from "./schema";
import { updateTodoById } from "@/model/logic/todo/todoLogic";

import type { ActionState } from "../../type";

/**
 * Todo を更新する Server Action.
 * @param id - 更新する Todo の ID.
 * @param _prevState - 前回の状態.
 * @param formData - フォームデータ.
 * @returns アクションの結果.
 */
export async function updateTodoAction(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawData = {
    title: formData.get("title") || undefined,
    completed: formData.get("completed") === "true",
  };

  // バリデーション.
  const parsed = updateTodoInputSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message: "バリデーションエラー.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // サービス層でビジネスロジックを実行.
  const result = await updateTodoById(id, parsed.data);

  if (result.isErr()) {
    return {
      success: false,
      message: result.error.message,
    };
  }

  revalidatePath("/todo");
  revalidatePath(`/${id}`);
  return {
    success: true,
    message: "Todo を更新した.",
  };
}
