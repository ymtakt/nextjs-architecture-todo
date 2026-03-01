"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/model/logic/auth/authLogic";
import { toggleTodoComplete } from "@/model/logic/todo/todoLogic";

type ActionState = {
  success: boolean;
  message: string;
};

/**
 * Todo の完了状態を切り替える Server Action.
 * @param id - 対象の Todo の ID.
 * @returns アクションの結果.
 */
export async function toggleTodoAction(id: string): Promise<ActionState> {
  // 認証チェック
  const user = await requireAuth();

  const result = await toggleTodoComplete(id, user.id);

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
    message: "Todo の状態を更新した.",
  };
}
