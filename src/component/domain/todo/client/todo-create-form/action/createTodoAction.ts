"use server";

import { revalidatePath } from "next/cache";

import type { CreateTodoFormInput } from "./schema";
import { createNewTodo } from "@/model/logic/todo/todoLogic";

type ActionState = {
  success: boolean;
  message: string;
};

/**
 * 新しい Todo を作成する Server Action.
 * @param data - バリデーション済みのフォームデータ.
 * @returns アクションの結果.
 */
export async function createTodoAction(data: CreateTodoFormInput): Promise<ActionState> {
  const result = await createNewTodo(data);

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
