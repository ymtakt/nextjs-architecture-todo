import Link from "next/link";

import { SignInForm } from "@/component/domain/auth/client/sign-in-form/SignInForm";

/**
 * サインインページのテンプレートコンポーネント.
 */
export function SignInPageTemplate() {
  return (
    <>
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
        ログイン
      </h1>
      <SignInForm />
      <p className="mt-4 text-center text-sm text-gray-600">
        アカウントをお持ちでない方は{" "}
        <Link href="/sign-up" className="text-blue-600 hover:underline">
          新規登録
        </Link>
      </p>
    </>
  );
}
