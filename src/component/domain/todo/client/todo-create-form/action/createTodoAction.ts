"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/model/logic/auth/authLogic";
import { createNewTodo } from "@/model/logic/todo/todoLogic";
import type { CreateTodoFormInput } from "./schema";

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
  // 認証チェック
  const user = await requireAuth();

  const result = await createNewTodo(data, user.id);

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
