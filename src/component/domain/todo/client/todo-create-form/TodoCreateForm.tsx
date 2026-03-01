"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { SubmitButton } from "@/component/shared/client/submit-button/SubmitButton";
import {
  createTodoInputSchema,
  type CreateTodoFormInput,
} from "@/component/domain/todo/client/todo-create-form/action/schema";
import { createTodoAction } from "@/component/domain/todo/client/todo-create-form/action/createTodoAction";

/**
 * 新しい Todo を作成するフォームコンポーネント.
 * React Hook Form を使用してバリデーションと送信を管理する.
 */
export function TodoCreateForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTodoFormInput>({
    resolver: zodResolver(createTodoInputSchema),
  });

  const onSubmit = async (data: CreateTodoFormInput) => {
    const result = await createTodoAction(data);
    if (result.success) {
      reset();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex space-x-2">
      <div className="flex-1">
        <input
          type="text"
          placeholder="新しい Todo を入力..."
          disabled={isSubmitting}
          className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          {...register("title")}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>
      <SubmitButton
        label="追加"
        loadingLabel="追加中..."
        isSubmitting={isSubmitting}
      />
    </form>
  );
}
