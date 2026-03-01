import { z } from "zod";

/** サインイン時の入力バリデーションスキーマ. */
export const signInInputSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください."),
  password: z.string().min(1, "パスワードを入力してください."),
});

/** サインイン時の入力型. */
export type SignInFormInput = z.infer<typeof signInInputSchema>;
