"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { getApiConfigSettings, patchApiConfigSettings } from "@/lib/api-config-api";
import {
  buildFormValuesFromConfig,
  buildPatchValues,
  groupHasChanges,
  validateFieldValue,
} from "@/lib/api-config-validation";
import { ApiConfigGroupSection } from "@/components/admin/api-config/api-config-group-section";
import { AlertBanner } from "@/components/ui/alert-banner";
import { formatDateTime } from "@/lib/format-date";
import type { ToastMessage } from "@/hooks/use-toast";
import type { ApiConfigField, ApiConfigGroup } from "@/types/api-config-api";

type AdminApiConfigSettingsPanelProps = {
  accessToken: string;
  canManage: boolean;
  setToast: (toast: ToastMessage | null) => void;
};

export function AdminApiConfigSettingsPanel({
  accessToken,
  canManage,
  setToast,
}: AdminApiConfigSettingsPanelProps) {
  const [groups, setGroups] = useState<ApiConfigGroup[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [initialValues, setInitialValues] = useState<Record<string, string>>({});
  const [clearedKeys, setClearedKeys] = useState<Set<string>>(() => new Set());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [savingGroupKey, setSavingGroupKey] = useState<string | null>(null);

  const applySettings = useCallback((nextGroups: ApiConfigGroup[], nextUpdatedAt: string | null) => {
    const values = buildFormValuesFromConfig(nextGroups);
    setGroups(nextGroups);
    setUpdatedAt(nextUpdatedAt);
    setFormValues(values);
    setInitialValues(values);
    setClearedKeys(new Set());
    setFieldErrors({});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = await getApiConfigSettings(accessToken);
      applySettings(body.groups, body.updated_at);
    } catch (e) {
      setGroups([]);
      setError(e instanceof Error ? e.message : "Failed to load env settings.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, applySettings]);

  useEffect(() => {
    void load();
  }, [load]);

  const groupChangeState = useMemo(() => {
    const state: Record<string, boolean> = {};
    for (const group of groups) {
      state[group.key] = groupHasChanges(
        group.fields,
        formValues,
        initialValues,
        clearedKeys,
      );
    }
    return state;
  }, [groups, formValues, initialValues, clearedKeys]);

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

  const validateFields = (fields: ApiConfigField[]): Record<string, string> => {
    const errors: Record<string, string> = {};
    for (const field of fields) {
      if (field.is_secret) {
        if (clearedKeys.has(field.key)) continue;
        continue;
      }
      const value = formValues[field.key] ?? "";
      const message = validateFieldValue(field, value);
      if (message) errors[field.key] = message;
    }
    return errors;
  };

  const handleSaveGroup = async (group: ApiConfigGroup) => {
    if (!canManage) return;

    const fields = group.fields;
    const errors = validateFields(fields);
    if (Object.keys(errors).length > 0) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        for (const field of fields) {
          delete next[field.key];
        }
        return { ...next, ...errors };
      });
      setToast({ kind: "error", message: `Fix validation errors in ${group.label} before saving.` });
      return;
    }

    const patchValues = buildPatchValues(fields, formValues, initialValues, clearedKeys);
    if (Object.keys(patchValues).length === 0) {
      setToast({ kind: "error", message: `No changes to save in ${group.label}.` });
      return;
    }

    setSavingGroupKey(group.key);
    try {
      const updated = await patchApiConfigSettings(accessToken, { values: patchValues });
      applySettings(updated.groups, updated.updated_at);
      setToast({ kind: "success", message: `${group.label} settings updated successfully.` });
    } catch (e) {
      setToast({
        kind: "error",
        message: e instanceof Error ? e.message : `Failed to update ${group.label} settings.`,
      });
    } finally {
      setSavingGroupKey(null);
    }
  };

  if (loading && groups.length === 0) {
    return (
      <div
        className="flex min-h-[16rem] flex-col items-center justify-center gap-3 text-muted-foreground"
        aria-busy="true"
      >
        <Loader2 className="size-8 animate-spin motion-reduce:animate-none" aria-hidden />
        <p className="text-sm">Loading env settings…</p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <SlidersHorizontal className="size-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">Env settings</h2>
            <p className="text-xs text-muted-foreground">
              Query strings, limits, and database URLs — API keys are managed on the Keys tab.
            </p>
          </div>
        </div>
        {updatedAt ? (
          <p className="text-sm text-muted-foreground">
            Last updated: <time dateTime={updatedAt}>{formatDateTime(updatedAt)}</time>
          </p>
        ) : null}
      </div>

      {error ? (
        <AlertBanner variant="warning">{error}</AlertBanner>
      ) : null}

      {groups.length > 0 ? (
        <div className="space-y-4">
          {groups.map((group, index) => (
            <ApiConfigGroupSection
              key={group.key}
              group={group}
              formValues={formValues}
              fieldErrors={fieldErrors}
              clearedKeys={clearedKeys}
              disabled={!canManage || savingGroupKey !== null || loading}
              saving={savingGroupKey === group.key}
              hasChanges={groupChangeState[group.key] ?? false}
              canManage={canManage}
              defaultOpen={index === 0}
              onFieldChange={handleFieldChange}
              onClearSecret={handleClearSecret}
              onUndoClearSecret={handleUndoClearSecret}
              onSave={() => void handleSaveGroup(group)}
            />
          ))}
        </div>
      ) : !loading && !error ? (
        <AlertBanner variant="warning">
          No env settings groups were returned by the API.
        </AlertBanner>
      ) : null}
    </section>
  );
}
