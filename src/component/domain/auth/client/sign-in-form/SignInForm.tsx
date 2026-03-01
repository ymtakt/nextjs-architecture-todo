"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  type SignInFormInput,
  signInInputSchema,
} from "@/component/domain/auth/client/sign-in-form/action/schema";
import { signInAction } from "@/component/domain/auth/client/sign-in-form/action/signInAction";
import { FormMessage } from "@/component/shared/client/form-message/FormMessage";
import { SubmitButton } from "@/component/shared/client/submit-button/SubmitButton";
import { TextInput } from "@/component/shared/client/text-input/TextInput";
import { firebaseAuth } from "@/external/firebase/client";

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
        data.password,
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
        if (
          e.message.includes("invalid-credential") ||
          e.message.includes("user-not-found") ||
          e.message.includes("wrong-password")
        ) {
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
      <TextInput
        id="email"
        label="メールアドレス"
        type="email"
        autoComplete="email"
        disabled={isSubmitting}
        registration={register("email")}
        error={errors.email}
      />

      <TextInput
        id="password"
        label="パスワード"
        type="password"
        autoComplete="current-password"
        disabled={isSubmitting}
        registration={register("password")}
        error={errors.password}
      />

      {error && <FormMessage type="error" message={error} />}

      <SubmitButton
        label="ログイン"
        loadingLabel="ログイン中..."
        isSubmitting={isSubmitting}
        fullWidth
      />
    </form>
  );
}
