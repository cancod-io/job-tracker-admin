type DetailSectionProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
};

export function DetailSection({ icon: Icon, title, children }: DetailSectionProps) {
  return (
    <section className="border-b border-border/60 px-5 py-4 last:border-0">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-primary" aria-hidden />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}
