"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Props = {
  item: {
    id: string;
    slug: string;
    title: string;
    author: string;
    coverImageUrl?: string | null;
    hasAudio: boolean;
    hasPdf: boolean;
    readingMinutes?: number | null;
    audioMinutes?: number | null;
  };
};

// cache de capa para evitar mltiplos fetches por card
let coversCache: string[] | null = null;
let coversPromise: Promise<string[]> | null = null;

export function ItemCard({ item }: Props) {
  const [src, setSrc] = useState<string>(item.coverImageUrl || "");
  const [fallbacks, setFallbacks] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    if (src) return; // j temos a capa do item
    if (coversCache) {
      setFallbacks(coversCache);
      return;
    }
    const load = async () => {
      try {
        if (!coversPromise) {
          coversPromise = fetch("/api/covers")
            .then((r) => r.json())
            .then((j) => (Array.isArray(j.images) ? j.images : []))
            .catch(() => []);
        }
        const list = await coversPromise;
        if (alive && list.length) {
          coversCache = list;
          setFallbacks(list);
        }
      } catch {}
    };
    load();
    return () => {
      alive = false;
    };
  }, [src]);

  const currentSrc = src || fallbacks[0] || "/illustrations/celebrate.svg";
  const minutesText = [
    item.readingMinutes ? `${item.readingMinutes} min leitura` : null,
    item.audioMinutes ? `${item.audioMinutes} min áudio` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <Card className="surface-card overflow-hidden group transition-all duration-300 hover:shadow-elevated hover:-translate-y-0.5 focus-within:ring-1 focus-within:ring-ring">
      <Link href={`/item/${item.slug}/read`} aria-label={`Ler ${item.title}`}>
        <div className="relative aspect-[3/4] bg-muted flex items-center justify-center overflow-hidden cover-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentSrc}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            onError={() => {
              if (fallbacks.length) {
                const [first, ...rest] = fallbacks;
                setSrc(first);
                setFallbacks(rest);
              } else {
                setSrc("/illustrations/celebrate.svg");
              }
            }}
          />

          {(item.hasAudio || item.hasPdf) && (
            <div className="absolute top-2 right-2 flex items-center gap-1">
              {item.hasAudio && (
                <Badge className="bg-black/70 text-white backdrop-blur px-1.5 py-0 h-5 text-[10px]">
                  Áudio
                </Badge>
              )}
              {item.hasPdf && (
                <Badge className="bg-black/70 text-white backdrop-blur px-1.5 py-0 h-5 text-[10px]">
                  PDF
                </Badge>
              )}
            </div>
          )}

          {/* Gradiente inferior para garantir legibilidade do título */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 px-3 pb-2">
            <div className="text-xs font-semibold tracking-tight text-white line-clamp-2 drop-shadow-sm">
              {item.title}
            </div>
          </div>
        </div>
      </Link>
      <CardHeader className="space-y-1">
        <h3 className="font-semibold leading-tight line-clamp-2 heading">
          {item.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {item.author}
        </p>
      </CardHeader>
      <CardContent>
        {item.hasAudio || item.hasPdf ? (
          <div className="text-xs text-muted-foreground">
            {minutesText || "Conteúdo otimizado"} - aprenda 95% em 20% do
            tempo
          </div>
        ) : (
          <Badge variant="secondary">Em produção</Badge>
        )}
      </CardContent>
    </Card>
  );
}


