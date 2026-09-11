import { createClient } from "@/lib/supabase/client";
import { buildAdminUserRows, type AdminRole, type AdminUserRow } from "@/lib/admin-users";
import { useAsyncData } from "./useAsyncData";

async function loadRows(): Promise<AdminUserRow[] | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profilesRes, loginHistoryRes] = await Promise.all([
    supabase.from("profiles").select("id, role, created_at, native_language"),
    supabase.from("login_history").select("user_id, logged_in_at"),
  ]);
  if (profilesRes.error) console.error("useAdminUsers: profiles load failed", profilesRes.error);
  if (loginHistoryRes.error) console.error("useAdminUsers: login_history load failed", loginHistoryRes.error);
  return buildAdminUserRows(profilesRes.data ?? [], loginHistoryRes.data ?? [], user.id);
}

export function useAdminUsers(): {
  rows: AdminUserRow[] | null;
  updateRole: (userId: string, role: AdminRole) => Promise<void>;
} {
  const { data: rows, setData: setRows } = useAsyncData(loadRows, []);

  async function updateRole(userId: string, role: AdminRole): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
    if (error) {
      console.error("useAdminUsers: updateRole failed", error);
      return;
    }
    setRows((prev) => (prev ? prev.map((r) => (r.id === userId ? { ...r, role } : r)) : prev));
  }

  return { rows, updateRole };
}
