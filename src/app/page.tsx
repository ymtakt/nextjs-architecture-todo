import { redirect } from "next/navigation";

/**
 * ルートページ.
 * /todo へリダイレクトする.
 */
export default function Home() {
  redirect("/todo");
}
