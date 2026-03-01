import Link from "next/link";

/**
 * Todo が見つからない場合の UI.
 */
export default function TodoNotFound() {
  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
        <h2 className="mb-2 text-lg font-semibold text-gray-800">Todo が見つからない</h2>
        <p className="mb-4 text-sm text-gray-600">
          指定された ID の Todo は存在しないか、削除された可能性がある。
        </p>
        <Link
          href="/todo"
          className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          一覧に戻る
        </Link>
      </div>
    </div>
  );
}
