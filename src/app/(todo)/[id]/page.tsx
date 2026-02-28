import { notFound } from "next/navigation";

import { TodoDetailPageTemplate } from "@/component/domain/todo";
import { todoService } from "@/model/logic/todo";

/**
 * ビルド時の静的生成を無効化し、リクエスト時に動的にレンダリングする.
 */
export const dynamic = "force-dynamic";

/**
 * Todo 詳細ページの Props.
 */
interface TodoDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Todo 詳細ページ.
 * サーバーコンポーネントとして指定された ID の todo を取得し、テンプレートに渡す.
 */
export default async function TodoDetailPage({ params }: TodoDetailPageProps) {
  const { id } = await params;
  const result = await todoService.getById(id);

  // NOT_FOUND エラーの場合は 404 ページを表示.
  if (result.isErr()) {
    if (result.error.type === "NOT_FOUND") {
      notFound();
    }
    throw new Error(result.error.message);
  }

  return <TodoDetailPageTemplate todo={result.value} />;
}
