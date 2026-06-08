import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <Sidebar email={user.email ?? ""} />
      <main className="md:ml-64">
        <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-10">
          {children}
        </div>
      </main>
    </div>
  );
}
