"use client";

import { useActionState } from "react";

import type { Todo } from "@/model/data/todo";

import { type ActionState, updateTodoAction } from "../actions";

/**
 * TodoEdit コンポーネントの Props.
 */
interface TodoEditProps {
  todo: Todo;
}

/**
 * 初期状態.
 */
const initialState: ActionState = {
  success: false,
  message: "",
};

/**
 * Todo の編集フォームを表示するクライアントコンポーネント.
 * useActionState を使用して Server Action と連携する.
 */
export function TodoEdit({ todo }: TodoEditProps) {
  // Server Action を ID でバインド.
  const boundAction = updateTodoAction.bind(null, todo.id);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          タイトル
        </label>
        <input
          type="text"
          id="title"
          name="title"
          defaultValue={todo.title}
          disabled={isPending}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
        />
        {state.errors?.title && (
          <p className="mt-1 text-sm text-red-600">{state.errors.title[0]}</p>
        )}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="completed"
          name="completed"
          value="true"
          defaultChecked={todo.completed}
          disabled={isPending}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="completed" className="ml-2 block text-sm text-gray-700">
          完了
        </label>
      </div>

      {state.message && !state.success && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      {state.message && state.success && (
        <p className="text-sm text-green-600">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
      >
        {isPending ? "更新中..." : "更新"}
      </button>
    </form>
  );
}
