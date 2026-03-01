import { TodoCreateForm } from "@/component/domain/todo/client/TodoCreateForm/TodoCreateForm";
import { TodoItem } from "@/component/domain/todo/client/TodoItem/TodoItem";
import { todoService } from "@/model/logic/todo/TodoLogic";

/**
 * Todo 一覧ページのテンプレートコンポーネント.
 * サーバーコンポーネントとしてデータを取得し、クライアントコンポーネントに渡す.
 */
export async function TodoPageTemplate() {
  const result = await todoService.getAll();

  // エラーの場合は例外をスロー（error.tsx でハンドリング）.
  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  const todos = result.value;

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
