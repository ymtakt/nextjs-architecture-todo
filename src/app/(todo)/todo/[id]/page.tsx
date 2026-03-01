import { TodoDetailPageTemplate } from "@/component/domain/todo/server/todo-detail-page-template/TodoDetailPageTemplate";

/**
 * Todo 詳細ページの Props.
 */
type TodoDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * Todo 詳細ページ.
 */
export default async function TodoDetailPage({ params }: TodoDetailPageProps) {
  const { id } = await params;
  return <TodoDetailPageTemplate id={id} />;
}
