"use server";

import { revalidatePath } from "next/cache";

import { todoService } from "@/model/logic/todo";

import type { ActionState } from "../../type";

/**
 * Todo を削除する Server Action.
 * @param id - 削除する Todo の ID.
 * @returns アクションの結果.
 */
export async function deleteTodoAction(id: string): Promise<ActionState> {
  const result = await todoService.delete(id);

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
