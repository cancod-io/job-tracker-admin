export default function HomePage() {
  return (
    <main className="container flex min-h-screen flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Shopify Job Tracker</h1>
      <p className="max-w-prose text-muted-foreground">
        Frontend scaffold is ready. Build out routes under <code>src/app/</code> and shared
        components under <code>src/components/</code>.
      </p>
      <p className="text-sm text-muted-foreground">
        Backend health check:{" "}
        <a className="underline" href="http://localhost:8000/health" target="_blank" rel="noreferrer">
          http://localhost:8000/health
        </a>
      </p>
    </main>
  );
}
