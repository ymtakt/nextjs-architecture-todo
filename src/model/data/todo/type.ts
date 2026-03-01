/** Todo エンティティの型. */
export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/** Todo 作成時の入力型. */
export type CreateTodoInput = {
  title: string;
};

/** Todo 更新時の入力型. */
export type UpdateTodoInput = {
  title?: string;
  completed?: boolean;
};
