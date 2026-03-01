"use client";

import { useActionState, useRef } from "react";

import { createTodoAction } from "@/component/domain/todo/client/TodoCreateForm/action/createTodoAction";
import type { ActionState } from "@/component/domain/todo/client/type";

/**
 * 初期状態.
 */
const initialState: ActionState = {
  success: false,
  message: "",
};

/**
 * 新しい Todo を作成するフォームコンポーネント.
 * useActionState を使用して Server Action と連携する.
 */
export function TodoCreateForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    async (prevState: ActionState, formData: FormData) => {
      const result = await createTodoAction(prevState, formData);
      // 成功時はフォームをリセット.
      if (result.success) {
        formRef.current?.reset();
      }
      return result;
    },
    initialState
  );

  return (
    <form ref={formRef} action={formAction} className="flex space-x-2">
      <div className="flex-1">
        <input
          type="text"
          name="title"
          placeholder="新しい Todo を入力..."
          disabled={isPending}
          className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
        />
        {state.errors?.title && (
          <p className="mt-1 text-sm text-red-600">{state.errors.title[0]}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
      >
        {isPending ? "追加中..." : "追加"}
      </button>
    </form>
  );
}
