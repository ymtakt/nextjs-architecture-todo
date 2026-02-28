import type { Todo } from "@/model/data/todo";

import { TodoCreateForm, TodoItem } from "../../client";

/**
 * TodoPageTemplate コンポーネントの Props.
 */
interface TodoPageTemplateProps {
  todos: Todo[];
}

/**
 * Todo 一覧ページのテンプレートコンポーネント.
 * Server Component として todos を受け取り、クライアントコンポーネントに渡す.
 */
export function TodoPageTemplate({ todos }: TodoPageTemplateProps) {
  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Todo リスト</h1>

      {/* Todo 作成フォーム. */}
      <div className="mb-6">
        <TodoCreateForm />
      </div>

      {/* Todo 一覧. */}
      <div className="space-y-2">
        {todos.length === 0 ? (
          <p className="text-center text-gray-500">
            Todo がありません。新しい Todo を追加してください。
          </p>
        ) : (
          todos.map((todo) => <TodoItem key={todo.id} todo={todo} />)
        )}
      </div>
    </div>
  );
}
