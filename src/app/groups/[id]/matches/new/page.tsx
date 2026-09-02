import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewMatchForm from "./NewMatchForm";

export default async function NewMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: myMembership } = await supabase
    .from("group_members")
    .select("status")
    .eq("group_id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!myMembership || myMembership.status !== "approved") notFound();

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, profiles(display_name, nickname)")
    .eq("group_id", id)
    .eq("status", "approved")
    .returns<
      {
        user_id: string;
        profiles: { display_name: string; nickname: string | null } | null;
      }[]
    >();

  const options = (members ?? []).map((m) => ({
    user_id: m.user_id,
    label: m.profiles?.nickname || m.profiles?.display_name || "Jogador",
  }));

  return <NewMatchForm groupId={id} members={options} />;
}
