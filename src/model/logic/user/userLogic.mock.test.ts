import { err, ok } from "neverthrow";
import { describe, expect, it, vi } from "vitest";

// リポジトリのモック
const mockFindUserByFirebaseUid = vi.fn();
const mockCreateUser = vi.fn();

vi.mock("@/model/repository/user/userRepository", () => ({
  findUserByFirebaseUid: (...args: unknown[]) => mockFindUserByFirebaseUid(...args),
  createUser: (...args: unknown[]) => mockCreateUser(...args),
}));

// 動的インポートでモックが適用された後にロード
const { getOrCreateUser } = await import("@/model/logic/user/userLogic");

describe("userLogic (repository error scenarios)", () => {
  describe("getOrCreateUser", () => {
    // 前提：findUserByFirebaseUid が DATABASE_ERROR を返す。
    // 期待値：INTERNAL_ERROR が返される。
    it("findUserByFirebaseUid が INTERNAL_ERROR を返した場合はそのエラーを返す", async () => {
      // Arrange
      mockFindUserByFirebaseUid.mockResolvedValue(
        err({ type: "DATABASE_ERROR", message: "Connection failed" }),
      );

      // Act
      const result = await getOrCreateUser({
        firebaseUid: "test-uid",
        email: "test@example.com",
      });

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("INTERNAL_ERROR");
        expect(result.error.message).toBe("Connection failed");
      }
    });

    // 前提：ユーザーが存在せず、createUser が ALREADY_EXISTS を返す。
    // 期待値：ALREADY_EXISTS エラーが返される。
    it("createUser が ALREADY_EXISTS を返した場合はそのエラーを返す", async () => {
      // Arrange
      mockFindUserByFirebaseUid.mockResolvedValue(
        err({ type: "NOT_FOUND", message: "User not found" }),
      );
      mockCreateUser.mockResolvedValue(
        err({ type: "ALREADY_EXISTS", message: "Email already exists" }),
      );

      // Act
      const result = await getOrCreateUser({
        firebaseUid: "test-uid",
        email: "duplicate@example.com",
      });

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("ALREADY_EXISTS");
        expect(result.error.message).toBe("Email already exists");
      }
    });

    // 前提：ユーザーが存在せず、createUser が成功する。
    // 期待値：作成されたユーザーが返される。
    it("createUser が成功した場合はユーザーを返す", async () => {
      // Arrange
      const mockUser = {
        id: "new-user-id",
        firebaseUid: "test-uid",
        email: "new@example.com",
        displayName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockFindUserByFirebaseUid.mockResolvedValue(
        err({ type: "NOT_FOUND", message: "User not found" }),
      );
      mockCreateUser.mockResolvedValue(ok(mockUser));

      // Act
      const result = await getOrCreateUser({
        firebaseUid: "test-uid",
        email: "new@example.com",
      });

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe("new-user-id");
      }
    });
  });
});
