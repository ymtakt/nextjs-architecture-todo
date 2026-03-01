import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/external/prisma";
import { getOrCreateUser, getUserByFirebaseUid } from "@/model/logic/user/userLogic";

describe("userLogic", () => {
  afterEach(async () => {
    // 各テスト後にクリーンアップ
    await prisma.todo.deleteMany();
    await prisma.user.deleteMany();
  });

  describe("getUserByFirebaseUid", () => {
    // 前提：指定した Firebase UID のユーザーが存在する。
    // 期待値：そのユーザーが取得できる。
    it("Firebase UID でユーザーを取得できる", async () => {
      // Arrange
      await prisma.user.create({
        data: {
          firebaseUid: "test-uid",
          email: "test@example.com",
          displayName: "Test User",
        },
      });

      // Act
      const result = await getUserByFirebaseUid("test-uid");

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.email).toBe("test@example.com");
        expect(result.value.displayName).toBe("Test User");
      }
    });

    // 前提：指定した Firebase UID のユーザーが存在しない。
    // 期待値：NOT_FOUND エラーが返される。
    it("存在しない Firebase UID の場合は NOT_FOUND エラーを返す", async () => {
      // Act
      const result = await getUserByFirebaseUid("non-existent-uid");

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("NOT_FOUND");
      }
    });
  });

  describe("getOrCreateUser", () => {
    // 前提：指定した Firebase UID のユーザーが既に存在する。
    // 期待値：既存のユーザーが返される（新規作成されない）。
    it("既存ユーザーが存在する場合はそのユーザーを返す", async () => {
      // Arrange
      await prisma.user.create({
        data: {
          firebaseUid: "existing-uid",
          email: "existing@example.com",
          displayName: "Existing User",
        },
      });

      // Act
      const result = await getOrCreateUser({
        firebaseUid: "existing-uid",
        email: "new@example.com", // 異なるメールでも既存ユーザーを返す
      });

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.email).toBe("existing@example.com");
        expect(result.value.displayName).toBe("Existing User");
      }
    });

    // 前提：指定した Firebase UID のユーザーが存在しない。
    // 期待値：新しいユーザーが作成される。
    it("ユーザーが存在しない場合は新規作成する", async () => {
      // Act
      const result = await getOrCreateUser({
        firebaseUid: "new-uid",
        email: "new@example.com",
        displayName: "New User",
      });

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.firebaseUid).toBe("new-uid");
        expect(result.value.email).toBe("new@example.com");
        expect(result.value.displayName).toBe("New User");
      }

      // DB にも作成されていることを確認
      const dbUser = await prisma.user.findUnique({
        where: { firebaseUid: "new-uid" },
      });
      expect(dbUser).not.toBeNull();
    });

    // 前提：displayName なしでユーザーを作成する。
    // 期待値：displayName が null のユーザーが作成される。
    it("displayName なしでもユーザーを作成できる", async () => {
      // Act
      const result = await getOrCreateUser({
        firebaseUid: "no-name-uid",
        email: "noname@example.com",
      });

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.displayName).toBeNull();
      }
    });

    // 前提：既存のメールアドレスで新規作成しようとする。
    // 期待値：ALREADY_EXISTS エラーが返される。
    it("既存のメールアドレスで新規作成しようとすると ALREADY_EXISTS エラーを返す", async () => {
      // Arrange
      await prisma.user.create({
        data: {
          firebaseUid: "uid-1",
          email: "duplicate@example.com",
        },
      });

      // Act
      const result = await getOrCreateUser({
        firebaseUid: "uid-2", // 異なる UID
        email: "duplicate@example.com", // 同じメール
      });

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("ALREADY_EXISTS");
      }
    });
  });
});
