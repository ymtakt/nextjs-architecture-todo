import { describe, expect, it, vi } from "vitest";
import { signUpAction } from "./signUpAction";

// authLogic のモック
const mockCreateSessionCookie = vi.fn();
const mockSetSessionCookie = vi.fn();

vi.mock("@/model/logic/auth/authLogic", () => ({
  createSessionCookie: (...args: unknown[]) => mockCreateSessionCookie(...args),
  setSessionCookie: (...args: unknown[]) => mockSetSessionCookie(...args),
}));

// userLogic のモック
const mockGetOrCreateUser = vi.fn();

vi.mock("@/model/logic/user/userLogic", () => ({
  getOrCreateUser: (...args: unknown[]) => mockGetOrCreateUser(...args),
}));

describe("signUpAction", () => {
  // 前提：セッション Cookie の作成に失敗する。
  // 期待値：エラーが返され、ユーザー作成は行われない。
  it("セッション Cookie の作成に失敗した場合はエラーを返す", async () => {
    // Arrange
    mockCreateSessionCookie.mockResolvedValue({
      isErr: () => true,
      error: { type: "INVALID_TOKEN", message: "無効なトークンです" },
    });

    // Act
    const result = await signUpAction({
      idToken: "invalid-token",
      email: "test@example.com",
      firebaseUid: "test-uid",
    });

    // Assert
    expect(result.success).toBe(false);
    expect(result.message).toBe("無効なトークンです");
    expect(mockGetOrCreateUser).not.toHaveBeenCalled();
  });

  // 前提：セッション Cookie は作成できるが、ユーザー作成に失敗する。
  // 期待値：エラーが返され、Cookie 設定は行われない。
  it("ユーザー作成に失敗した場合はエラーを返す", async () => {
    // Arrange
    mockCreateSessionCookie.mockResolvedValue({
      isErr: () => false,
      value: "session-cookie-value",
    });
    mockGetOrCreateUser.mockResolvedValue({
      isErr: () => true,
      error: { type: "DUPLICATE_EMAIL", message: "このメールアドレスは既に使用されています" },
    });

    // Act
    const result = await signUpAction({
      idToken: "valid-token",
      email: "duplicate@example.com",
      firebaseUid: "test-uid",
    });

    // Assert
    expect(result.success).toBe(false);
    expect(result.message).toBe("このメールアドレスは既に使用されています");
    expect(mockSetSessionCookie).not.toHaveBeenCalled();
  });

  // 前提：ユーザー作成は成功するが、Cookie の設定に失敗する。
  // 期待値：エラーが返される。
  it("Cookie の設定に失敗した場合はエラーを返す", async () => {
    // Arrange
    mockCreateSessionCookie.mockResolvedValue({
      isErr: () => false,
      value: "session-cookie-value",
    });
    mockGetOrCreateUser.mockResolvedValue({
      isErr: () => false,
      value: { id: "user-id", firebaseUid: "test-uid", email: "test@example.com" },
    });
    mockSetSessionCookie.mockResolvedValue({
      isErr: () => true,
      error: { type: "INTERNAL_ERROR", message: "Cookie の設定に失敗しました" },
    });

    // Act
    const result = await signUpAction({
      idToken: "valid-token",
      email: "test@example.com",
      firebaseUid: "test-uid",
    });

    // Assert
    expect(result.success).toBe(false);
    expect(result.message).toBe("Cookie の設定に失敗しました");
  });

  // 前提：有効な認証情報でサインアップする。
  // 期待値：サインアップが成功する。
  it("正常にサインアップできる", async () => {
    // Arrange
    mockCreateSessionCookie.mockResolvedValue({
      isErr: () => false,
      value: "session-cookie-value",
    });
    mockGetOrCreateUser.mockResolvedValue({
      isErr: () => false,
      value: { id: "user-id", firebaseUid: "test-uid", email: "test@example.com" },
    });
    mockSetSessionCookie.mockResolvedValue({
      isErr: () => false,
      value: undefined,
    });

    // Act
    const result = await signUpAction({
      idToken: "valid-token",
      email: "test@example.com",
      displayName: "Test User",
      firebaseUid: "test-uid",
    });

    // Assert
    expect(result.success).toBe(true);
    expect(result.message).toBe("アカウントを作成しました.");
    expect(mockCreateSessionCookie).toHaveBeenCalledWith("valid-token");
    expect(mockGetOrCreateUser).toHaveBeenCalledWith({
      firebaseUid: "test-uid",
      email: "test@example.com",
      displayName: "Test User",
    });
    expect(mockSetSessionCookie).toHaveBeenCalledWith("session-cookie-value");
  });

  // 前提：displayName なしでサインアップする。
  // 期待値：displayName が undefined のユーザーが作成される。
  it("displayName なしでもサインアップできる", async () => {
    // Arrange
    mockCreateSessionCookie.mockResolvedValue({
      isErr: () => false,
      value: "session-cookie-value",
    });
    mockGetOrCreateUser.mockResolvedValue({
      isErr: () => false,
      value: { id: "user-id", firebaseUid: "test-uid", email: "test@example.com" },
    });
    mockSetSessionCookie.mockResolvedValue({
      isErr: () => false,
      value: undefined,
    });

    // Act
    const result = await signUpAction({
      idToken: "valid-token",
      email: "test@example.com",
      firebaseUid: "test-uid",
    });

    // Assert
    expect(result.success).toBe(true);
    expect(mockGetOrCreateUser).toHaveBeenCalledWith({
      firebaseUid: "test-uid",
      email: "test@example.com",
      displayName: undefined,
    });
  });
});
