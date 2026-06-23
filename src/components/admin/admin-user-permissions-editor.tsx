"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminRolePermissionsChecklist } from "@/components/admin/admin-role-permissions-checklist";
import {
  getPermissionCatalog,
  getUserPermissions,
  updateUserPermissions,
} from "@/lib/admin-permissions-api";
import { isAdminRole } from "@/lib/admin-permissions";
import { roleLabel } from "@/lib/user-approval";
import { useAdminPermissions } from "@/providers/admin-permissions-provider";
import { useAuth } from "@/providers/auth-provider";
import type { AdminPermissionsResponse } from "@/types/admin-permissions-api";

type AdminUserPermissionsEditorProps = {
  userId: number;
  userName: string;
  compact?: boolean;
  onSaved?: () => void;
};

export function AdminUserPermissionsEditor({
  userId,
  userName,
  compact = false,
  onSaved,
}: AdminUserPermissionsEditorProps) {
  const { accessToken } = useAuth();
  const { can, refetch: refetchMyPermissions } = useAdminPermissions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [roleTemplate, setRoleTemplate] = useState<string[]>([]);
  const [targetRole, setTargetRole] = useState<string>("user");
  const [editable, setEditable] = useState(false);
  const [editorCatalog, setEditorCatalog] = useState<AdminPermissionsResponse | null>(null);

  const canManage = can("permissions.manage");

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const [userPerms, catalog] = await Promise.all([
        getUserPermissions(accessToken, userId),
        getPermissionCatalog(accessToken),
      ]);

      setUserPermissions(userPerms.user_permissions);
      setRoleTemplate(userPerms.role_template);
      setTargetRole(userPerms.role);
      setEditable(userPerms.editable);

      setEditorCatalog({ catalog, roles: [] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load user permissions.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (permissions: string[]) => {
    if (!accessToken || !editable) return;
    const updated = await updateUserPermissions(accessToken, userId, { permissions });
    setUserPermissions(updated.user_permissions);
    setRoleTemplate(updated.role_template);
    setTargetRole(updated.role);
    setEditable(updated.editable);
    await refetchMyPermissions();
    onSaved?.();
  };

  if (!canManage) {
    return null;
  }

  if (loading && !editorCatalog) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading permissions…
      </div>
    );
  }

  if (error && !editorCatalog) {
    return (
      <div className="space-y-3">
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <AdminRolePermissionsChecklist
      targetRole={targetRole}
      matrix={editorCatalog}
      loading={loading}
      editable={editable && canManage}
      compact={compact}
      scope="user"
      scopeTitle={`${userName}'s access`}
      userPermissions={userPermissions}
      roleTemplate={roleTemplate}
      onSave={editable ? handleSave : undefined}
      saveLabel="permissions"
      hintText={
        isAdminRole(targetRole)
          ? "Admin accounts always have full access and cannot be edited."
          : roleTemplate.length > 0
            ? `Default for ${roleLabel(targetRole)} role: ${roleTemplate.length} permission${roleTemplate.length === 1 ? "" : "s"} (${roleTemplate.join(", ")}).`
            : `No default permissions for the ${roleLabel(targetRole)} role template.`
      }
    />
  );
}
