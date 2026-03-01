"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword } from "firebase/auth";

import { firebaseAuth } from "@/external/firebase/client";
import {
  signUpInputSchema,
  type SignUpFormInput,
} from "@/component/domain/auth/client/sign-up-form/action/schema";
import { signUpAction } from "@/component/domain/auth/client/sign-up-form/action/signUpAction";

/**
 * サインアップフォームコンポーネント.
 */
export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormInput>({
    resolver: zodResolver(signUpInputSchema),
  });

  const onSubmit = async (data: SignUpFormInput) => {
    setError(null);

    try {
      // Firebase Auth でユーザー作成
      const userCredential = await createUserWithEmailAndPassword(
        firebaseAuth,
        data.email,
        data.password
      );

      // ID トークン取得
      const idToken = await userCredential.user.getIdToken();

      // Server Action でセッション作成 + DB ユーザー作成
      const result = await signUpAction({
        idToken,
        email: data.email,
        firebaseUid: userCredential.user.uid,
      });

      if (!result.success) {
        setError(result.message);
        return;
      }

      // 成功時は Todo ページへ
      router.push("/todo");
      router.refresh();
    } catch (e) {
      if (e instanceof Error) {
        // Firebase エラーメッセージを日本語化
        if (e.message.includes("email-already-in-use")) {
          setError("このメールアドレスは既に使用されています.");
        } else {
          setError(e.message);
        }
      } else {
        setError("アカウント作成に失敗しました.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          メールアドレス
        </label>
        <input
          type="email"
          id="email"
          autoComplete="email"
          disabled={isSubmitting}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          {...register("email")}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          パスワード
        </label>
        <input
          type="password"
          id="password"
          autoComplete="new-password"
          disabled={isSubmitting}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          {...register("password")}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          パスワード（確認）
        </label>
        <input
          type="password"
          id="confirmPassword"
          autoComplete="new-password"
          disabled={isSubmitting}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
      >
        {isSubmitting ? "作成中..." : "アカウント作成"}
      </button>
    </form>
  );
}
