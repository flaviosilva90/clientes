import { redirect } from "next/navigation";

export default function Home() {
  // O middleware cuida do caso "nao autenticado" (redireciona para /login).
  redirect("/dashboard");
}
