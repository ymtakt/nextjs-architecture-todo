"use server";

import { revalidatePath } from "next/cache";

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
  const result = await deleteTodoById(id);

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
