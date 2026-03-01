"use client";

import Link from "next/link";
import { useTransition } from "react";

import type { Todo } from "@/model/data/todo/type";

import { deleteTodoAction } from "@/component/domain/todo/client/todo-item/action/deleteTodoAction";
import { toggleTodoAction } from "@/component/domain/todo/client/todo-item/action/toggleTodoAction";

/**
 * TodoItem コンポーネントの Props.
 */
type TodoItemProps = {
  todo: Todo;
};

/**
 * 個別の Todo アイテムを表示するクライアントコンポーネント.
 * 完了状態の切り替えと削除機能を持つ.
 */
export function TodoItem({ todo }: TodoItemProps) {
  const [isPending, startTransition] = useTransition();

  /**
   * 完了状態を切り替える.
   */
  const handleToggle = () => {
    startTransition(async () => {
      await toggleTodoAction(todo.id);
    });
  };

  /**
   * Todo を削除する.
   */
  const handleDelete = () => {
    startTransition(async () => {
      await deleteTodoAction(todo.id);
    });
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={handleToggle}
          disabled={isPending}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <Link
          href={`/todo/${todo.id}`}
          className={`text-gray-900 hover:text-blue-600 ${todo.completed ? "line-through text-gray-400" : ""
            }`}
        >
          {todo.title}
        </Link>
      </div>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="text-sm text-red-600 hover:text-red-800 disabled:text-red-300"
      >
        {isPending ? "処理中..." : "削除"}
      </button>
    </div>
  );
}
