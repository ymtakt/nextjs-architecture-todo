"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { signInWithEmail } from "@/external/firebase/auth";

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

    // Firebase Auth でログイン
    const authResult = await signInWithEmail(data.email, data.password);
    if (authResult.isErr()) {
      setError(authResult.error.message);
      return;
    }

    // Server Action でセッション作成
    const result = await signInAction({
      idToken: authResult.value.idToken,
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
