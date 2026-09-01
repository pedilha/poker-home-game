"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function approveMember(groupId: string, userId: string) {
  const supabase = await createClient();
  await supabase
    .from("group_members")
    .update({ status: "approved" })
    .eq("group_id", groupId)
    .eq("user_id", userId);
  revalidatePath(`/groups/${groupId}`);
}

export async function rejectMember(groupId: string, userId: string) {
  const supabase = await createClient();
  await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);
  revalidatePath(`/groups/${groupId}`);
}

// só o dono promove/rebaixa admin
export async function setMemberRole(
  groupId: string,
  userId: string,
  role: "admin" | "member",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: group } = await supabase
    .from("groups")
    .select("owner_id")
    .eq("id", groupId)
    .maybeSingle();
  if (!group || group.owner_id !== user.id) return;

  await supabase
    .from("group_members")
    .update({ role })
    .eq("group_id", groupId)
    .eq("user_id", userId);
  revalidatePath(`/groups/${groupId}`);
}

// dono remove qualquer um; admin só remove membro comum; dono nunca é removido
export async function removeMember(groupId: string, userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: myMembership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  const { data: target } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!myMembership || !target || target.role === "owner") return;

  const canRemove =
    myMembership.role === "owner" ||
    (myMembership.role === "admin" && target.role === "member");
  if (!canRemove) return;

  await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);
  revalidatePath(`/groups/${groupId}`);
}
