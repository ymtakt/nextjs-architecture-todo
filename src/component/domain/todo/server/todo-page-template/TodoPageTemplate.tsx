import { TodoCreateForm } from "@/component/domain/todo/client/todo-create-form/TodoCreateForm";
import { TodoItem } from "@/component/domain/todo/client/todo-item/TodoItem";
import { SignOutButton } from "@/component/domain/auth/client/sign-out-button/SignOutButton";
import { requireAuth } from "@/model/logic/auth/authLogic";
import { getAllTodos } from "@/model/logic/todo/todoLogic";

/**
 * Todo 一覧ページのテンプレートコンポーネント.
 * サーバーコンポーネントとしてデータを取得し、クライアントコンポーネントに渡す.
 */
export async function TodoPageTemplate() {
  // 認証チェック（未認証なら /sign-in へリダイレクト）
  const user = await requireAuth();

  const result = await getAllTodos(user.id);

  // エラーの場合は例外をスロー（error.tsx でハンドリング）.
  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  const todos = result.value;

  return (
    <div className="mx-auto max-w-2xl p-4">
      {/* ヘッダー */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Todo リスト</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.email}</span>
          <SignOutButton />
        </div>
      </div>

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
