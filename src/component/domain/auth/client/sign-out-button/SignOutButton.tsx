"use client";

import { signOut } from "firebase/auth";

import { firebaseAuth } from "@/external/firebase/client";
import { signOutAction } from "@/component/domain/auth/client/sign-out-button/action/signOutAction";

/**
 * サインアウトボタンコンポーネント.
 */
export function SignOutButton() {
  const handleSignOut = async () => {
    // Firebase からサインアウト
    await signOut(firebaseAuth);
    // Server Action でセッション削除
    await signOutAction();
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-md bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
    >
      ログアウト
    </button>
  );
}
