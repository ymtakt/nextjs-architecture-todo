"use server";

import { revalidatePath } from "next/cache";

import type { UpdateTodoFormInput } from "./schema";
import { requireAuth } from "@/model/logic/auth/authLogic";
import { updateTodoById } from "@/model/logic/todo/todoLogic";

type ActionState = {
  success: boolean;
  message: string;
};

/**
 * Todo を更新する Server Action.
 * @param id - 更新する Todo の ID.
 * @param data - バリデーション済みのフォームデータ.
 * @returns アクションの結果.
 */
export async function updateTodoAction(
  id: string,
  data: UpdateTodoFormInput
): Promise<ActionState> {
  // 認証チェック
  const user = await requireAuth();

  const result = await updateTodoById(id, data, user.id);

  if (result.isErr()) {
    return {
      success: false,
      message: result.error.message,
    };
  }

  revalidatePath("/todo");
  revalidatePath(`/todo/${id}`);
  return {
    success: true,
    message: "Todo を更新した.",
  };
}
