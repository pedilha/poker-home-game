import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("group_members")
    .select("status, groups(id, name)")
    .eq("user_id", user.id)
    .returns<{ status: string; groups: { id: string; name: string } | null }[]>();

  const approved = (memberships ?? []).filter((m) => m.status === "approved");
  const pending = (memberships ?? []).filter((m) => m.status === "pending");

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="mx-auto w-full max-w-sm space-y-8">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Seus grupos
        </h1>

        {approved.length === 0 && pending.length === 0 ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Você ainda não faz parte de nenhum grupo.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/groups/new"
                className="flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
              >
                Criar grupo
              </Link>
              <Link
                href="/groups/join"
                className="flex h-11 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
              >
                Entrar com código
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ul className="space-y-2">
              {approved.map((m) =>
                m.groups ? (
                  <li key={m.groups.id}>
                    <Link
                      href={`/groups/${m.groups.id}`}
                      className="flex h-14 items-center rounded-2xl border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
                    >
                      {m.groups.name}
                    </Link>
                  </li>
                ) : null,
              )}
            </ul>

            {pending.length > 0 && (
              <ul className="space-y-2">
                {pending.map((m) =>
                  m.groups ? (
                    <li
                      key={m.groups.id}
                      className="flex h-14 items-center rounded-2xl border border-dashed border-zinc-300 px-5 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
                    >
                      {m.groups.name} — aguardando aprovação
                    </li>
                  ) : null,
                )}
              </ul>
            )}

            <div className="flex gap-3 text-sm font-medium">
              <Link href="/groups/new" className="text-zinc-600 underline dark:text-zinc-400">
                Criar grupo
              </Link>
              <Link href="/groups/join" className="text-zinc-600 underline dark:text-zinc-400">
                Entrar com código
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
