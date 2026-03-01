"use client";

import type { ComponentProps } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

type Props = {
  id: string;
  label?: string;
  type?: ComponentProps<"input">["type"];
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  registration: UseFormRegisterReturn;
  error?: FieldError;
};

/**
 * ラベル・入力・エラー表示をまとめたテキスト入力コンポーネント.
 * label を省略するとラベルなしで表示される.
 */
export function TextInput({
  id,
  label,
  type = "text",
  placeholder,
  autoComplete,
  disabled,
  registration,
  error,
}: Props) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        type={type}
        id={id}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className={`block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 ${label ? "mt-1" : ""}`}
        {...registration}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
    </div>
  );
}
