type DetailRowProps = {
  label: string;
  children: React.ReactNode;
};

export function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 py-1.5 text-sm sm:grid-cols-[8.5rem_1fr]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-foreground">{children}</dd>
    </div>
  );
}
