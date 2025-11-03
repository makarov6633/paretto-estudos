"use client";

import type { ReactNode } from "react";

type PageHeroStat = {
  label: string;
  value: string;
  helper?: string;
};

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  stats?: PageHeroStat[];
  tone?: "emerald" | "amber" | "neutral";
};

const toneAccent: Record<NonNullable<PageHeroProps["tone"]>, string> = {
  emerald: "from-[color-mix(in srgb,var(--hero-highlight) 75%,transparent 25%)]",
  amber: "from-[color-mix(in srgb,rgba(234,179,8,0.6) 70%,transparent 30%)]",
  neutral: "from-[color-mix(in srgb,var(--overlay-soft) 80%,transparent 20%)]",
};

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  stats,
  tone = "emerald",
}: PageHeroProps) {
  const accent = toneAccent[tone] ?? toneAccent.emerald;

  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-border bg-[color:var(--overlay-card)] px-6 py-10 shadow-[0_35px_70px_-40px_rgba(15,23,42,0.45)] sm:px-10 sm:py-14">
      <div className={`absolute inset-0 bg-[radial-gradient(circle_at_top,var(--hero-highlight)_0%,transparent_65%)]`} />
      <div className={`absolute inset-0 bg-gradient-to-b ${accent} via-transparent to-transparent opacity-80`} />
      <div className="absolute -top-12 sm:-top-24 left-2 sm:left-12 h-32 w-32 sm:h-64 sm:w-64 rounded-full bg-[color-mix(in srgb,var(--hero-highlight) 45%,transparent 55%)] blur-3xl" />
      <div className="absolute -bottom-16 sm:-bottom-32 right-2 sm:right-10 h-40 w-40 sm:h-72 sm:w-72 rounded-full bg-[color-mix(in srgb,var(--hero-highlight) 55%,transparent 45%)] blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom, rgba(255,255,255,0.04), transparent_35%, rgba(0,0,0,0.08))]" />
      <div className="relative space-y-8 text-foreground">
        <div className="space-y-4">
          {eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-[color:var(--overlay-soft)] px-3 py-1 text-xs uppercase tracking-[0.4em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-[color-mix(in srgb,var(--hero-highlight) 80%,transparent 20%)] animate-pulse" />
              {eyebrow}
            </span>
          ) : null}
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-[2.8rem] sm:leading-[1.05] md:text-[3.2rem]">
              {title}
            </h1>
            {description ? (
              <p className="max-w-3xl text-base text-muted-foreground sm:text-lg">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex flex-wrap gap-3 text-sm sm:text-base">
            {actions}
          </div>
        ) : null}
        {stats && stats.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={`${stat.label}-${stat.value}`}
                className="rounded-2xl border border-border/70 bg-[color:var(--overlay-soft)] px-4 py-4"
              >
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {stat.value}
                </p>
                {stat.helper ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.helper}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default PageHero;
