import { TodoDetailPageTemplate } from "@/component/domain/todo/server/TodoDetailPageTemplate/TodoDetailPageTemplate";

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
 */
export default async function TodoDetailPage({ params }: TodoDetailPageProps) {
  const { id } = await params;
  return <TodoDetailPageTemplate id={id} />;
}
