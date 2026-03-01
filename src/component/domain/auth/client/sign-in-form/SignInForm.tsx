"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";

import { firebaseAuth } from "@/external/firebase/client";
import {
  signInInputSchema,
  type SignInFormInput,
} from "@/component/domain/auth/client/sign-in-form/action/schema";
import { signInAction } from "@/component/domain/auth/client/sign-in-form/action/signInAction";

/**
 * サインインフォームコンポーネント.
 */
export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormInput>({
    resolver: zodResolver(signInInputSchema),
  });

  const onSubmit = async (data: SignInFormInput) => {
    setError(null);

    try {
      // Firebase Auth でログイン
      const userCredential = await signInWithEmailAndPassword(
        firebaseAuth,
        data.email,
        data.password
      );

      // ID トークン取得
      const idToken = await userCredential.user.getIdToken();

      // Server Action でセッション作成
      const result = await signInAction({
        idToken,
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
        if (e.message.includes("invalid-credential") || e.message.includes("user-not-found") || e.message.includes("wrong-password")) {
          setError("メールアドレスまたはパスワードが正しくありません.");
        } else {
          setError(e.message);
        }
      } else {
        setError("ログインに失敗しました.");
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
          autoComplete="current-password"
          disabled={isSubmitting}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          {...register("password")}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
      >
        {isSubmitting ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
}
