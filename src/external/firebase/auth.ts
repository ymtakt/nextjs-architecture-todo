import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { err, ok, type Result } from "neverthrow";
import { firebaseAuth } from "@/external/firebase/client";

/** Firebase Auth のエラー型. */
export type FirebaseAuthError = {
  type: "INVALID_CREDENTIALS" | "EMAIL_ALREADY_IN_USE" | "UNKNOWN_ERROR";
  message: string;
};

/** 認証成功時の結果. */
export type AuthCredentials = {
  uid: string;
  idToken: string;
};

type AuthResult<T> = Result<T, FirebaseAuthError>;

/**
 * Firebase エラーを FirebaseAuthError に変換する.
 */
function toFirebaseAuthError(e: unknown): FirebaseAuthError {
  if (e instanceof Error) {
    if (
      e.message.includes("invalid-credential") ||
      e.message.includes("user-not-found") ||
      e.message.includes("wrong-password")
    ) {
      return {
        type: "INVALID_CREDENTIALS",
        message: "メールアドレスまたはパスワードが正しくありません.",
      };
    }
    if (e.message.includes("email-already-in-use")) {
      return {
        type: "EMAIL_ALREADY_IN_USE",
        message: "このメールアドレスは既に使用されています.",
      };
    }
    return {
      type: "UNKNOWN_ERROR",
      message: e.message,
    };
  }
  return {
    type: "UNKNOWN_ERROR",
    message: "予期しないエラーが発生しました.",
  };
}

/**
 * メールアドレスとパスワードでサインインする.
 */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult<AuthCredentials>> {
  try {
    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    const idToken = await userCredential.user.getIdToken();
    return ok({
      uid: userCredential.user.uid,
      idToken,
    });
  } catch (e) {
    return err(toFirebaseAuthError(e));
  }
}

/**
 * メールアドレスとパスワードでアカウントを作成する.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthResult<AuthCredentials>> {
  try {
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    const idToken = await userCredential.user.getIdToken();
    return ok({
      uid: userCredential.user.uid,
      idToken,
    });
  } catch (e) {
    return err(toFirebaseAuthError(e));
  }
}

/**
 * Firebase からサインアウトする.
 */
export async function signOutFromFirebase(): Promise<AuthResult<void>> {
  try {
    await signOut(firebaseAuth);
    return ok(undefined);
  } catch (e) {
    return err(toFirebaseAuthError(e));
  }
}
