import * as React from "react";

export function PageShell({ title, actions, children }: {
  title: string; actions?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-[rgba(246,248,250,.75)] dark:supports-[backdrop-filter]:bg-[rgba(13,17,23,.6)] border-b border-border">
        <div className="mx-auto max-w-[1200px] px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="flex items-center gap-2">{actions}</div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-6">
        {children}
      </main>
    </div>
  );
}

export function Section({ title, desc, right, children }: {
  title: string; desc?: string; right?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="mb-2 flex items-end justify-between">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {desc && <p className="text-sm text-muted">{desc}</p>}
        </div>
        {right}
      </div>
      <div className="primer-card p-4 shadow-subtle">{children}</div>
    </section>
  );
}
