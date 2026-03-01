import Link from "next/link";

import { SignUpForm } from "@/component/domain/auth/client/sign-up-form/SignUpForm";

/**
 * サインアップページのテンプレートコンポーネント.
 */
export function SignUpPageTemplate() {
  return (
    <>
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">アカウント作成</h1>
      <SignUpForm />
      <p className="mt-4 text-center text-sm text-gray-600">
        既にアカウントをお持ちの方は{" "}
        <Link href="/sign-in" className="text-blue-600 hover:underline">
          ログイン
        </Link>
      </p>
    </>
  );
}
