import { Suspense } from "react";
import { ItemCard } from "@/components/ItemCard";

async function ItemsList({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const q = typeof searchParams.q === "string" ? searchParams.q : undefined;
  const tag = typeof searchParams.tag === "string" ? searchParams.tag : undefined;
  const hasAudio = typeof searchParams.audio === "string" ? searchParams.audio : undefined;
  const hasPdf = typeof searchParams.read === "string" ? searchParams.read : undefined;

  const url = new URL(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/items`, typeof window === "undefined" ? "http://localhost" : window.location.origin);
  if (q) url.searchParams.set("q", q);
  if (tag) url.searchParams.set("tag", tag);
  if (hasAudio === "1") url.searchParams.set("hasAudio", "1");
  if (hasPdf === "1") url.searchParams.set("hasPdf", "1");

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await res.json();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {data.items?.map((it: any) => (
        <ItemCard key={it.id} item={it} />
      ))}
    </div>
  );
}

export default function LibraryPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
        <form className="flex-1">
          <input
            type="text"
            name="q"
            defaultValue={typeof searchParams.q === "string" ? searchParams.q : ""}
            placeholder="Encontre seu próximo título"
            className="w-full h-11 rounded-md border bg-background px-4"
          />
        </form>
        <div className="flex items-center gap-2 text-sm">
          <a href="/library?read=1" className="px-3 py-2 rounded-md border">Leitura</a>
          <a href="/library?audio=1" className="px-3 py-2 rounded-md border">Áudio</a>
          <a href="/library" className="px-3 py-2 rounded-md border">Todos</a>
        </div>
      </div>

      <Suspense fallback={<div>Carregando…</div>}>
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        <ItemsList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}


