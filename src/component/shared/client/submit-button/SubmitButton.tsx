"use client";

type Props = {
  label: string;
  loadingLabel: string;
  isSubmitting: boolean;
  fullWidth?: boolean;
};

/**
 * 送信ボタンコンポーネント.
 * ローディング状態の表示に対応.
 */
export function SubmitButton({
  label,
  loadingLabel,
  isSubmitting,
  fullWidth = false,
}: Props) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className={`inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 ${fullWidth ? "w-full" : ""}`}
    >
      {isSubmitting ? loadingLabel : label}
    </button>
  );
}
