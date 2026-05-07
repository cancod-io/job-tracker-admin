import { Users } from "lucide-react";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Users</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          View accounts, application activity, and support escalations across the platform.
        </p>
      </header>
      <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-10 text-center text-sm text-muted-foreground">
        <Users className="mx-auto mb-3 size-10 text-primary/60" aria-hidden />
        User directory and detail drawers will be implemented here.
      </div>
    </div>
  );
}
