"use server";

import { createSessionCookie, setSessionCookie } from "@/model/logic/auth/authLogic";
import { getUserByFirebaseUid } from "@/model/logic/user/userLogic";

type ActionState = {
  success: boolean;
  message: string;
};

type SignInActionInput = {
  idToken: string;
  firebaseUid: string;
};

/**
 * サインイン後のセッション作成 Server Action.
 * Firebase Auth でのログインはクライアントで行い、この Action でセッションを作成する.
 */
export async function signInAction(input: SignInActionInput): Promise<ActionState> {
  // ユーザーが DB に存在するか確認
  const userResult = await getUserByFirebaseUid(input.firebaseUid);
  if (userResult.isErr()) {
    return {
      success: false,
      message: "ユーザーが見つかりません.",
    };
  }

  // セッション Cookie 作成
  const sessionCookieResult = await createSessionCookie(input.idToken);
  if (sessionCookieResult.isErr()) {
    return {
      success: false,
      message: sessionCookieResult.error.message,
    };
  }

  // Cookie 設定
  const setResult = await setSessionCookie(sessionCookieResult.value);
  if (setResult.isErr()) {
    return {
      success: false,
      message: setResult.error.message,
    };
  }

  return {
    success: true,
    message: "ログインしました.",
  };
}
