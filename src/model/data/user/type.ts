/** User エンティティの型. */
export type User = {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** User 作成時の入力型. */
export type CreateUserInput = {
  firebaseUid: string;
  email: string;
  displayName?: string;
};
