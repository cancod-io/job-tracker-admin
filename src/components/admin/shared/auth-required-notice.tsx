type AuthRequiredNoticeProps = {
  resourceLabel: string;
};

export function AuthRequiredNotice({ resourceLabel }: AuthRequiredNoticeProps) {
  return (
    <div
      className="rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
      role="status"
    >
      Sign in to manage {resourceLabel}. The endpoint uses the{" "}
      <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
        Authorization: Bearer &lt;token&gt;
      </code>{" "}
      header.
    </div>
  );
}
