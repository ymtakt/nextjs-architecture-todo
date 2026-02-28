import { TodoPageTemplate } from "@/component/domain/todo";
import { todoService } from "@/model/logic/todo";

/**
 * ビルド時の静的生成を無効化し、リクエスト時に動的にレンダリングする.
 */
export const dynamic = "force-dynamic";

/**
 * Todo 一覧ページ.
 * サーバーコンポーネントとして todos を取得し、テンプレートに渡す.
 */
export default async function TodoPage() {
  const result = await todoService.getAll();

  // エラーの場合は例外をスロー（error.tsx でハンドリング）.
  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  return <TodoPageTemplate todos={result.value} />;
}
