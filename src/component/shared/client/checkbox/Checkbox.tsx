"use client";

import type { UseFormRegisterReturn } from "react-hook-form";

type Props = {
  id: string;
  label: string;
  disabled?: boolean;
  registration: UseFormRegisterReturn;
};

/**
 * ラベル付きチェックボックスコンポーネント.
 */
export function Checkbox({ id, label, disabled, registration }: Props) {
  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        id={id}
        disabled={disabled}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        {...registration}
      />
      <label htmlFor={id} className="ml-2 block text-sm text-gray-700">
        {label}
      </label>
    </div>
  );
}
