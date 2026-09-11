"use client";

import { useAdminUsers } from "@/lib/hooks/useAdminUsers";
import type { AdminRole, NativeLanguage } from "@/lib/admin-users";

const ROLE_LABEL: Record<AdminRole, string> = { user: "일반 사용자", admin: "관리자" };
const NATIVE_LANGUAGE_LABEL: Record<NativeLanguage, string> = { ko: "한국", ja: "일본" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR");
}

export default function AdminUsersPage() {
  const { rows, updateRole } = useAdminUsers();

  async function handleRoleChange(userId: string, nextRole: AdminRole) {
    if (!window.confirm(`이 사용자를 "${ROLE_LABEL[nextRole]}"(으)로 변경할까요?`)) return;
    await updateRole(userId, nextRole);
  }

  if (!rows) {
    return (
      <div role="status" aria-live="polite" className="text-sm text-zinc-500">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-500">
        이메일은 표시되지 않습니다(서버에 이메일 조회 권한이 없음) — 사용자 ID 기준으로 구분하세요.
      </p>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full min-w-max text-left text-sm">
          <thead className="border-b border-zinc-200 text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">사용자 ID</th>
              <th className="px-4 py-3 font-medium">권한</th>
              <th className="px-4 py-3 font-medium">모국어</th>
              <th className="px-4 py-3 font-medium">가입일</th>
              <th className="px-4 py-3 font-medium">최근 로그인</th>
              <th className="px-4 py-3 font-medium">작업</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const nextRole: AdminRole = row.role === "admin" ? "user" : "admin";
              return (
                <tr key={row.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600">{row.id}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        row.role === "admin" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {ROLE_LABEL[row.role]}
                      {row.isSelf ? " (나)" : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {row.nativeLanguage ? NATIVE_LANGUAGE_LABEL[row.nativeLanguage] : "-"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{formatDate(row.createdAt)}</td>
                  <td className="px-4 py-3 text-zinc-600">{row.lastLoginAt ? formatDate(row.lastLoginAt) : "-"}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={row.isSelf}
                      onClick={() => handleRoleChange(row.id, nextRole)}
                      aria-label={`${row.id}의 권한을 ${ROLE_LABEL[nextRole]}(으)로 변경`}
                      className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {ROLE_LABEL[nextRole]}(으)로 변경
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
