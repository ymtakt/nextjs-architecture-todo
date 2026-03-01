"use client";

import Link from "next/link";

/**
 * Todo 詳細ページのエラー UI.
 */
export default function TodoDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-4">
        <Link href="/todo" className="text-blue-600 hover:text-blue-800 hover:underline">
          &larr; 一覧に戻る
        </Link>
      </div>
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="mb-2 text-lg font-semibold text-red-800">エラーが発生した</h2>
        <p className="mb-4 text-sm text-red-600">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          再試行
        </button>
      </div>
    </div>
  );
}
