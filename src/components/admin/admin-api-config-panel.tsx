"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { getApiConfig, patchApiConfig } from "@/lib/api-config-api";
import {
  buildFormValuesFromConfig,
  buildPatchValues,
  validateFieldValue,
} from "@/lib/api-config-validation";
import { formatDateTime } from "@/lib/format-date";
import { useAdminPermissions } from "@/providers/admin-permissions-provider";
import { useAuth } from "@/providers/auth-provider";
import { ApiConfigGroupSection } from "@/components/admin/api-config/api-config-group-section";
import { AuthRequiredNotice } from "@/components/admin/shared/auth-required-notice";
import { ListNotifications } from "@/components/admin/shared/list-notifications";
import { AlertBanner } from "@/components/ui/alert-banner";
import { useToast } from "@/hooks/use-toast";
import type { ApiConfigField, ApiConfigResponse } from "@/types/api-config-api";

export function AdminApiConfigPanel() {
  const { accessToken } = useAuth();
  const { can } = useAdminPermissions();
  const canManage = can("api_config.manage");
  const { toast, setToast } = useToast();

  const [config, setConfig] = useState<ApiConfigResponse | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [initialValues, setInitialValues] = useState<Record<string, string>>({});
  const [clearedKeys, setClearedKeys] = useState<Set<string>>(() => new Set());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allFields = useMemo(
    () => config?.groups.flatMap((group) => group.fields) ?? [],
    [config],
  );

  const applyConfig = useCallback((body: ApiConfigResponse) => {
    const values = buildFormValuesFromConfig(body.groups);
    setConfig(body);
    setFormValues(values);
    setInitialValues(values);
    setClearedKeys(new Set());
    setFieldErrors({});
  }, []);

  const load = useCallback(async () => {
    if (!accessToken) {
      setConfig(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = await getApiConfig(accessToken);
      applyConfig(body);
    } catch (e) {
      setConfig(null);
      setError(e instanceof Error ? e.message : "Failed to load API configuration.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, applyConfig]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleFieldChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleClearSecret = (key: string) => {
    setClearedKeys((prev) => new Set(prev).add(key));
    setFormValues((prev) => ({ ...prev, [key]: "" }));
  };

  const handleUndoClearSecret = (key: string) => {
    setClearedKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const validateForm = (fields: ApiConfigField[]): Record<string, string> => {
    const errors: Record<string, string> = {};
    for (const field of fields) {
      if (field.is_secret) {
        if (clearedKeys.has(field.key)) continue;
        const typed = (formValues[field.key] ?? "").trim();
        if (typed) continue;
        continue;
      }
      const value = formValues[field.key] ?? "";
      const message = validateFieldValue(field, value);
      if (message) errors[field.key] = message;
    }
    return errors;
  };

  const handleSave = async () => {
    if (!accessToken || !config) return;

    const errors = validateForm(allFields);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setToast({ kind: "error", message: "Fix validation errors before saving." });
      return;
    }

    const patchValues = buildPatchValues(allFields, formValues, initialValues, clearedKeys);
    if (Object.keys(patchValues).length === 0) {
      setToast({ kind: "error", message: "No changes to save." });
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const body = await patchApiConfig(accessToken, { values: patchValues });
      applyConfig(body);
      setToast({ kind: "success", message: "API configuration saved successfully." });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save API configuration.";
      setToast({ kind: "error", message });
    } finally {
      setSaving(false);
    }
  };

  if (!accessToken) {
    return <AuthRequiredNotice resourceLabel="API configuration" />;
  }

  if (loading && !config) {
    return (
      <div
        className="flex min-h-[20rem] flex-col items-center justify-center gap-3 text-muted-foreground"
        aria-busy="true"
      >
        <Loader2 className="size-8 animate-spin motion-reduce:animate-none" aria-hidden />
        <p className="text-sm">Loading API configuration…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          {config?.updated_at ? (
            <p className="text-sm text-muted-foreground">
              Last updated:{" "}
              <time dateTime={config.updated_at}>{formatDateTime(config.updated_at)}</time>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No settings saved yet.</p>
          )}
          <p className="text-xs text-muted-foreground">
            Changes apply on the api-service&apos;s next config refresh or scrape run.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading || saving}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
        >
          <RefreshCw
            className={`size-4 ${loading ? "animate-spin motion-reduce:animate-none" : ""}`}
            aria-hidden
          />
          Refresh
        </button>
      </div>

      <ListNotifications toast={toast} error={error} />

      {!canManage ? (
        <AlertBanner variant="warning">
          You have read-only access. Contact an administrator if you need to edit these settings.
        </AlertBanner>
      ) : null}

      {config ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave();
          }}
          className="space-y-4"
          noValidate
        >
          {config.groups.map((group, index) => (
            <ApiConfigGroupSection
              key={group.key}
              group={group}
              formValues={formValues}
              fieldErrors={fieldErrors}
              clearedKeys={clearedKeys}
              disabled={!canManage || saving}
              defaultOpen={index === 0}
              onFieldChange={handleFieldChange}
              onClearSecret={handleClearSecret}
              onUndoClearSecret={handleUndoClearSecret}
            />
          ))}

          {canManage ? (
            <div className="flex justify-end border-t border-border/60 pt-4">
              <button
                type="submit"
                disabled={saving || loading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
                ) : null}
                Save changes
              </button>
            </div>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
