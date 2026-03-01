import { z } from "zod";

/** サインアップ時の入力バリデーションスキーマ. */
export const signUpInputSchema = z
  .object({
    email: z.string().email("有効なメールアドレスを入力してください."),
    password: z
      .string()
      .min(6, "パスワードは6文字以上である必要があります.")
      .max(100, "パスワードは100文字以内である必要があります."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません.",
    path: ["confirmPassword"],
  });

/** サインアップ時の入力型. */
export type SignUpFormInput = z.infer<typeof signUpInputSchema>;
