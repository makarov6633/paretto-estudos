import { headers } from "next/headers";
import { ItemCard } from "@/components/ItemCard";
import type { Item } from "@/types";

type SearchParams = Record<string, string | string[] | undefined>;

async function ItemsList({ searchParams }: { searchParams: SearchParams }) {
  const q = typeof searchParams.q === "string" ? searchParams.q : undefined;
  const tag = typeof searchParams.tag === "string" ? searchParams.tag : undefined;
  const hasPdf = typeof searchParams.read === "string" ? searchParams.read : undefined;

  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const origin =
    process.env.NEXT_PUBLIC_BASE_URL && process.env.NEXT_PUBLIC_BASE_URL.length > 0
      ? process.env.NEXT_PUBLIC_BASE_URL
      : `${proto}://${host}`;
  const url = new URL("/api/items", origin);
  if (q) url.searchParams.set("q", q);
  if (tag) url.searchParams.set("tag", tag);
  if (hasPdf === "1") url.searchParams.set("hasPdf", "1");

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = (await res.json()) as { items?: Item[] };
  const items: Item[] = Array.isArray(data.items) ? data.items : [];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {items.map((it) => (
        <ItemCard key={it.id} item={it} />
      ))}
    </div>
  );
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const list = await ItemsList({ searchParams: sp });

  return (
    <main className="page-shell">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end">
          <form className="flex-1">
            <input
              type="text"
              name="q"
              defaultValue={typeof sp.q === "string" ? sp.q : ""}
              placeholder="Encontre seu próximo título"
              className="h-10 sm:h-11 w-full rounded-md border border-border bg-card px-3 sm:px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary touch-manipulation"
            />
          </form>
          <div className="flex items-center gap-2 text-xs sm:text-sm overflow-x-auto pb-1">
            <a href="/library?read=1" className="rounded-md border border-border px-3 py-2 transition-colors hover:bg-[color:var(--overlay-card)] whitespace-nowrap touch-manipulation">
              Com PDF
            </a>
            <a href="/library" className="rounded-md border border-border px-3 py-2 transition-colors hover:bg-[color:var(--overlay-card)] whitespace-nowrap touch-manipulation">
              Todos
            </a>
          </div>
        </div>

        {list}
      </div>
    </main>
  );
}
