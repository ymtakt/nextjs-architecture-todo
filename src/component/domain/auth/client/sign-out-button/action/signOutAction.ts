"use server";

import { redirect } from "next/navigation";

import { clearSessionCookie } from "@/model/logic/auth/authLogic";

/**
 * サインアウト Server Action.
 */
export async function signOutAction(): Promise<void> {
  // エラーでもリダイレクトする（ログアウトは必ず実行）
  await clearSessionCookie();
  redirect("/sign-in");
}
