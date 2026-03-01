"use server";

import {
  createSessionCookie,
  setSessionCookie,
} from "@/model/logic/auth/authLogic";
import { getOrCreateUser } from "@/model/logic/user/userLogic";

type ActionState = {
  success: boolean;
  message: string;
};

type SignUpActionInput = {
  idToken: string;
  email: string;
  displayName?: string;
  firebaseUid: string;
};

/**
 * サインアップ後のセッション作成 Server Action.
 * Firebase Auth での登録はクライアントで行い、この Action でセッションを作成する.
 */
export async function signUpAction(
  input: SignUpActionInput
): Promise<ActionState> {
  // セッション Cookie 作成
  const sessionCookieResult = await createSessionCookie(input.idToken);
  if (sessionCookieResult.isErr()) {
    return {
      success: false,
      message: sessionCookieResult.error.message,
    };
  }

  // DB にユーザー作成
  const userResult = await getOrCreateUser({
    firebaseUid: input.firebaseUid,
    email: input.email,
    displayName: input.displayName,
  });

  if (userResult.isErr()) {
    return {
      success: false,
      message: userResult.error.message,
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
    message: "アカウントを作成しました.",
  };
}
