"use server";

import { revalidatePath } from "next/cache";

import { toggleTodoComplete } from "@/model/logic/todo/todoLogic";

import type { ActionState } from "../../type";

/**
 * Todo の完了状態を切り替える Server Action.
 * @param id - 対象の Todo の ID.
 * @returns アクションの結果.
 */
export async function toggleTodoAction(id: string): Promise<ActionState> {
  const result = await toggleTodoComplete(id);

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
    message: "Todo の状態を更新した.",
  };
}
