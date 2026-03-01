import Link from "next/link";
import { notFound } from "next/navigation";

import { TodoEdit } from "@/component/domain/todo/client/todo-edit/TodoEdit";
import { getTodoById } from "@/model/logic/todo/todoLogic";

/**
 * TodoDetailPageTemplate コンポーネントの Props.
 */
type TodoDetailPageTemplateProps = {
  id: string;
};

/**
 * Todo 詳細ページのテンプレートコンポーネント.
 * サーバーコンポーネントとして ID を受け取り、データを取得して編集フォームを表示する.
 */
export async function TodoDetailPageTemplate({ id }: TodoDetailPageTemplateProps) {
  const result = await getTodoById(id);

  // NOT_FOUND エラーの場合は 404 ページを表示.
  if (result.isErr()) {
    if (result.error.type === "NOT_FOUND") {
      notFound();
    }
    throw new Error(result.error.message);
  }

  const todo = result.value;

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-6">
        <Link
          href="/todo"
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          &larr; 一覧に戻る
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">Todo 詳細</h1>

      {/* メタ情報. */}
      <div className="mb-6 rounded-lg bg-gray-50 p-4">
        <dl className="space-y-2 text-sm">
          <div className="flex">
            <dt className="w-24 font-medium text-gray-500">ID:</dt>
            <dd className="text-gray-900">{todo.id}</dd>
          </div>
          <div className="flex">
            <dt className="w-24 font-medium text-gray-500">作成日時:</dt>
            <dd className="text-gray-900">
              {todo.createdAt.toLocaleString("ja-JP")}
            </dd>
          </div>
          <div className="flex">
            <dt className="w-24 font-medium text-gray-500">更新日時:</dt>
            <dd className="text-gray-900">
              {todo.updatedAt.toLocaleString("ja-JP")}
            </dd>
          </div>
        </dl>
      </div>

      {/* 編集フォーム. */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium text-gray-900">編集</h2>
        <TodoEdit todo={todo} />
      </div>
    </div>
  );
}
