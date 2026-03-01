"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  type UpdateTodoFormInput,
  updateTodoInputSchema,
} from "@/component/domain/todo/client/todo-edit/action/schema";
import { updateTodoAction } from "@/component/domain/todo/client/todo-edit/action/updateTodoAction";
import { Checkbox } from "@/component/shared/client/checkbox/Checkbox";
import { FormMessage } from "@/component/shared/client/form-message/FormMessage";
import { SubmitButton } from "@/component/shared/client/submit-button/SubmitButton";
import { TextInput } from "@/component/shared/client/text-input/TextInput";
import type { Todo } from "@/model/data/todo/type";

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
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
      <TextInput
        id="title"
        label="タイトル"
        disabled={isSubmitting}
        registration={register("title")}
        error={errors.title}
      />

      <Checkbox
        id="completed"
        label="完了"
        disabled={isSubmitting}
        registration={register("completed")}
      />

      {message && <FormMessage type={message.type} message={message.text} />}

      <SubmitButton label="更新" loadingLabel="更新中..." isSubmitting={isSubmitting} />
    </form>
  );
}
