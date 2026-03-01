"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  type SignUpFormInput,
  signUpInputSchema,
} from "@/component/domain/auth/client/sign-up-form/action/schema";
import { signUpAction } from "@/component/domain/auth/client/sign-up-form/action/signUpAction";
import { FormMessage } from "@/component/shared/client/form-message/FormMessage";
import { SubmitButton } from "@/component/shared/client/submit-button/SubmitButton";
import { TextInput } from "@/component/shared/client/text-input/TextInput";
import { signUpWithEmail } from "@/external/firebase/auth";

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

    // Firebase Auth でユーザー作成
    const authResult = await signUpWithEmail(data.email, data.password);
    if (authResult.isErr()) {
      setError(authResult.error.message);
      return;
    }

    // Server Action でセッション作成 + DB ユーザー作成
    const result = await signUpAction({
      idToken: authResult.value.idToken,
      email: data.email,
      firebaseUid: authResult.value.uid,
    });

    if (!result.success) {
      setError(result.message);
      return;
    }

    // 成功時は Todo ページへ
    router.push("/todo");
    router.refresh();
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
