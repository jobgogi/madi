export type AdminRole = "user" | "admin";
export type NativeLanguage = "ko" | "ja";

export interface AdminUserRow {
  id: string;
  role: AdminRole;
  createdAt: string;
  lastLoginAt: string | null;
  isSelf: boolean;
  nativeLanguage: NativeLanguage | null;
}

// 사용자 관리 화면(app/admin/users) 데이터 조합 — profiles + login_history를
// 합쳐서 화면에 필요한 행을 만든다. profiles에는 이메일이 없고(auth.users는
// PostgREST로 노출되지 않음), service role 키도 이 앱에는 없어서 이메일 표시는
// 범위 밖으로 뺐다.
export function buildAdminUserRows(
  profiles: { id: string; role: AdminRole; created_at: string; native_language: NativeLanguage | null }[],
  loginHistory: { user_id: string; logged_in_at: string }[],
  currentUserId: string
): AdminUserRow[] {
  const lastLogin = new Map<string, string>();
  for (const row of loginHistory) {
    const prev = lastLogin.get(row.user_id);
    if (!prev || row.logged_in_at > prev) lastLogin.set(row.user_id, row.logged_in_at);
  }

  return profiles
    .map((p) => ({
      id: p.id,
      role: p.role,
      createdAt: p.created_at,
      lastLoginAt: lastLogin.get(p.id) ?? null,
      isSelf: p.id === currentUserId,
      nativeLanguage: p.native_language,
    }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
