"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword } from "firebase/auth";

import { firebaseAuth } from "@/external/firebase/client";
import { FormMessage } from "@/component/shared/client/form-message/FormMessage";
import { SubmitButton } from "@/component/shared/client/submit-button/SubmitButton";
import { TextInput } from "@/component/shared/client/text-input/TextInput";
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
        autoComplete="new-password"
        disabled={isSubmitting}
        registration={register("password")}
        error={errors.password}
      />

      <TextInput
        id="confirmPassword"
        label="パスワード（確認）"
        type="password"
        autoComplete="new-password"
        disabled={isSubmitting}
        registration={register("confirmPassword")}
        error={errors.confirmPassword}
      />

      {error && <FormMessage type="error" message={error} />}

      <SubmitButton
        label="アカウント作成"
        loadingLabel="作成中..."
        isSubmitting={isSubmitting}
        fullWidth
      />
    </form>
  );
}
