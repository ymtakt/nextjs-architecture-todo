"use client";

type Props = {
  type: "success" | "error";
  message: string;
};

/**
 * フォームのメッセージ表示コンポーネント.
 * 成功・エラーに応じて色を変える.
 */
export function FormMessage({ type, message }: Props) {
  const colorClass = type === "success" ? "text-green-600" : "text-red-600";
  return <p className={`text-sm ${colorClass}`}>{message}</p>;
}
