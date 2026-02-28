"use client";

/**
 * Todo 一覧ページのエラー UI.
 */
export default function TodoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="mb-2 text-lg font-semibold text-red-800">
          エラーが発生した
        </h2>
        <p className="mb-4 text-sm text-red-600">{error.message}</p>
        <button
          onClick={reset}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          再試行
        </button>
      </div>
    </div>
  );
}
