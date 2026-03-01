"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type { Todo } from "@/model/data/todo/type";

import {
  updateTodoInputSchema,
  type UpdateTodoFormInput,
} from "@/component/domain/todo/client/todo-edit/action/schema";
import { updateTodoAction } from "@/component/domain/todo/client/todo-edit/action/updateTodoAction";

/**
 * TodoEdit コンポーネントの Props.
 */
type Props = {
  todo: Todo;
};

/**
 * Todo の編集フォームを表示するクライアントコンポーネント.
 * React Hook Form を使用してバリデーションと送信を管理する.
 */
export function TodoEdit({ todo }: Props) {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateTodoFormInput>({
    resolver: zodResolver(updateTodoInputSchema),
    defaultValues: {
      title: todo.title,
      completed: todo.completed,
    },
  });

  const onSubmit = async (data: UpdateTodoFormInput) => {
    const result = await updateTodoAction(todo.id, data);
    setMessage({
      type: result.success ? "success" : "error",
      text: result.message,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          タイトル
        </label>
        <input
          type="text"
          id="title"
          disabled={isSubmitting}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          {...register("title")}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="completed"
          disabled={isSubmitting}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          {...register("completed")}
        />
        <label htmlFor="completed" className="ml-2 block text-sm text-gray-700">
          完了
        </label>
      </div>

      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
      >
        {isSubmitting ? "更新中..." : "更新"}
      </button>
    </form>
  );
}
