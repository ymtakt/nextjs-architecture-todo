"use server";

import { revalidatePath } from "next/cache";

import { createTodoInputSchema, updateTodoInputSchema } from "@/model/data/todo";
import { todoService } from "@/model/logic/todo";

/**
 * Server Action のレスポンス型.
 */
export type ActionState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

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
  const result = await todoService.update(id, parsed.data);

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

/**
 * Todo の完了状態を切り替える Server Action.
 * @param id - 対象の Todo の ID.
 * @returns アクションの結果.
 */
export async function toggleTodoAction(id: string): Promise<ActionState> {
  const result = await todoService.toggleComplete(id);

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
