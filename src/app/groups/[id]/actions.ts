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
