/**
 * Todo 一覧ページのローディング UI.
 */
export default function TodoLoading() {
  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-6 h-8 w-32 animate-pulse rounded bg-gray-200" />
      <div className="mb-6 h-10 animate-pulse rounded bg-gray-200" />
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg bg-gray-200"
          />
        ))}
      </div>
    </div>
  );
}
