/**
 * Todo 一覧ページのローディング UI.
 */
export default function TodoLoading() {
  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-6 h-8 w-32 animate-pulse rounded bg-gray-200" />
      <div className="mb-6 h-10 animate-pulse rounded bg-gray-200" />
      <div className="space-y-2">
        {["skeleton-1", "skeleton-2", "skeleton-3"].map((id) => (
          <div key={id} className="h-16 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    </div>
  );
}
