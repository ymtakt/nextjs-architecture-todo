"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/model/logic/auth/authLogic";
import { deleteTodoById } from "@/model/logic/todo/todoLogic";

type ActionState = {
  success: boolean;
  message: string;
};

/**
 * Todo を削除する Server Action.
 * @param id - 削除する Todo の ID.
 * @returns アクションの結果.
 */
export async function deleteTodoAction(id: string): Promise<ActionState> {
  // 認証チェック
  const user = await requireAuth();

  const result = await deleteTodoById(id, user.id);

  if (result.isErr()) {
    return {
      success: false,
      message: result.error.message,
    };
  }

  revalidatePath("/todo");
  return {
    success: true,
    message: "Todo を削除した.",
  };
}
