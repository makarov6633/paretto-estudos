"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { Item, SyncMap as SyncMapType } from "@/types";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useSession } from "@/lib/auth-client";

type FullItem = Item & {
  pdfUrl?: string | null;
  sections?: Array<{ orderIndex: number; heading?: string | null; contentHtml?: string | null }>;
  audioTracks?: Array<{ audioUrl: string; durationMs?: number | null; language?: string | null; voice?: string | null }>;
  syncMap?: SyncMapType | null;
};

declare global {
  interface Window {
    parettoNarrator?: {
      skipMetaIntro: (opts?: { ms?: number; chapterIndex?: number }) => void;
      hasSkippableIntro?: boolean;
      chapters?: number;
    };
  }
}

const SKIP_META_EVENT = "paretto:narrator:skip-meta-intro";

async function fetchItem(slug: string): Promise<FullItem | null> {
  const url = new URL(`/api/items?slug=${encodeURIComponent(slug)}&expand=full`, window.location.origin);
  const data = await fetch(url.toString()).then((r) => r.json());
  return (data.items?.[0] as FullItem) ?? null;
}

export default function ReadPage() {
  const { slug } = useParams<{ slug: string }>();
  interface SyncPoint { t: number; i?: number; w?: number }
  const [item, setItem] = useState<FullItem | null>(null);
  const [scale, setScale] = useState(1);
  const [pdfScale, setPdfScale] = useState(1);
  const [readerTheme, setReaderTheme] = useState<'system' | 'light' | 'sepia' | 'dark'>('dark');
  const [keepPitch, setKeepPitch] = useState(true);
  const [syncEnabled] = useState(true); // keep sync always on, controls hidden for now
  const [syncOffsetMs] = useState(800); // delay to keep text slightly behind audio
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { data: session } = useSession();
  const [showPdf, setShowPdf] = useState(true);
  const [speed, setSpeed] = useState(1);
  // Minimal dock is always visible (low opacity). We no longer auto-hide fully.
  const [isPaused, setIsPaused] = useState(true);
  const [showChapters, setShowChapters] = useState(false);

  useEffect(() => {
    fetchItem(slug).then(setItem);
  }, [slug]);

  // Immersive mode: hide site chrome while on this page
  useEffect(() => {
    document.body.classList.add('immersive');
    return () => { document.body.classList.remove('immersive'); };
  }, []);

  // no-op; kept for possible future gestures

  // Telemetry: open / play / finish
  useEffect(() => {
    if (!item || !session?.user?.id) return;
    fetch('/api/telemetry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: session.user.id, itemId: item.id, name: 'open' }) }).catch(()=>{});
  }, [item, session?.user?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !item || !session?.user?.id) return;
    const onPlay = () => { setIsPaused(false); fetch('/api/telemetry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: session.user.id, itemId: item.id, name: 'play' }) }).catch(()=>{}); };
    const onPause = () => { setIsPaused(true); };
    const onEnd = () => fetch('/api/telemetry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: session.user.id, itemId: item.id, name: 'finish' }) }).catch(()=>{});
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnd);
    return () => { audio.removeEventListener('play', onPlay); audio.removeEventListener('pause', onPause); audio.removeEventListener('ended', onEnd); };
  }, [item, session?.user?.id]);

  // Sync: supports section-level or word-level maps
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !item || !item.syncMap || !syncEnabled) return;
    const isWord = item.syncMap?.granularity === "word";
    const rawPoints = (item.syncMap?.data as SyncPoint[] | undefined) ?? [];
    const points: SyncPoint[] = rawPoints.map((p) => ({ t: Number(p.t) || 0, i: p.i, w: p.w }));
    if (!points.length) return;
    let lastIdx = -1;
    let lastTs = 0;
    const onTime = () => {
      const now = performance.now();
      if (now - lastTs < 250) return; // throttle updates
      lastTs = now;
      const t = audio.currentTime * 1000 - syncOffsetMs;
      // binary search for last point <= t
      let lo = 0, hi = points.length - 1, idx = 0;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (points[mid].t <= t) { idx = mid; lo = mid + 1; } else { hi = mid - 1; }
      }
      if (idx === lastIdx) return;
      lastIdx = idx;
      const sectionIndex = points[idx]?.i ?? 0;
      const sectionEl = document.querySelector(`[data-sec="${sectionIndex}"]`);
      if (sectionEl && containerRef.current) {
        const top = (sectionEl as HTMLElement).offsetTop - 80;
        containerRef.current.scrollTo({ top, behavior: "smooth" });
      }
      if (isWord) {
        const prev = document.querySelector(`[data-current-word='1']`) as HTMLElement | null;
        if (prev) prev.removeAttribute('data-current-word');
        const w = points[idx]?.w ?? 0;
        const wordEl = document.querySelector(`[data-sec="${sectionIndex}"] [data-w="${w}"]`) as HTMLElement | null;
        if (wordEl) wordEl.setAttribute('data-current-word','1');
      }
    };
    audio.addEventListener("timeupdate", onTime);
    return () => audio.removeEventListener("timeupdate", onTime);
  }, [item, syncEnabled, syncOffsetMs]);

  const sections = useMemo(() => item?.sections ?? [], [item]);

  const chapterCount = useMemo(() => {
    if (sections.length > 0) return sections.length;
    const syncData = item?.syncMap?.data;
    if (!syncData || !Array.isArray(syncData)) return 0;
    let maxIndex = -1;
    const seen = new Set<number>();
    for (const entry of syncData as Array<{ i?: number }>) {
      const value = typeof entry?.i === "number" ? entry.i : undefined;
      if (typeof value !== "number" || Number.isNaN(value)) continue;
      const index = Math.max(0, Math.trunc(value));
      seen.add(index);
      if (index > maxIndex) maxIndex = index;
    }
    if (seen.size > 0) return Math.max(seen.size, maxIndex + 1);
    return maxIndex >= 0 ? maxIndex + 1 : 0;
  }, [sections.length, item?.syncMap?.data]);

  const chapterCountLabel = useMemo(() => {
    if (chapterCount === 1) return "1 capitulo";
    if (chapterCount > 1) return `${chapterCount} capitulos`;
    return "Capitulos";
  }, [chapterCount]);

  const track = useMemo(() => item?.audioTracks?.[0], [item]);

  const syncPoints = useMemo(() => {
    const syncData = item?.syncMap?.data;
    if (!syncData || !Array.isArray(syncData)) return [] as Array<{ t: number; i: number; w?: number }>;
    return (syncData as Array<{ t?: number; i?: number; w?: number }>).map((entry) => ({
      t: Number(entry.t) || 0,
      i: Math.max(0, Math.trunc(typeof entry.i === "number" ? entry.i : 0)),
      w: typeof entry.w === "number" ? Math.trunc(entry.w) : undefined,
    }));
  }, [item?.syncMap?.data]);

  const chapterStartsMs = useMemo(() => {
    if (!chapterCount) return [] as number[];
    const starts = Array.from({ length: chapterCount }, () => Number.NaN);
    for (const point of syncPoints) {
      const index = Math.min(point.i, chapterCount - 1);
      if (Number.isNaN(starts[index]) || point.t < starts[index]) starts[index] = point.t;
    }
    return starts.map((value, index) => (Number.isNaN(value) ? (index === 0 ? 0 : value) : value));
  }, [chapterCount, syncPoints]);

  const firstMainChapterIndex = useMemo(() => {
    const normalizeHeading = (heading: string) =>
      heading.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const isMeta = (heading: string) => {
      const ascii = normalizeHeading(heading);
      return /meta|apresentacao|prefacio|sumario|sinopse|sobre|nota|agradecimentos|como usar|introducao/.test(ascii)
        && !/capitulo|cap\.|cap\s/.test(ascii);
    };
    const looksLikeChapter = (heading: string) => {
      const ascii = normalizeHeading(heading);
      return /capitulo|cap\.|cap\s|^\s*[ivx]+(\.|$)|\b\d+\b/.test(ascii);
    };
    for (let index = 0; index < sections.length; index += 1) {
      const heading = sections[index]?.heading ?? "";
      if (!heading) continue;
      if (!isMeta(heading) && looksLikeChapter(heading)) return index;
    }
    if (sections.length > 1) {
      const firstHeading = sections[0]?.heading ?? "";
      if (firstHeading && isMeta(firstHeading)) return 1;
    }
    return 0;
  }, [sections]);

  const canSkipIntro = useMemo(() => {
    if (!chapterStartsMs.length) return false;
    const target = chapterStartsMs[firstMainChapterIndex];
    return firstMainChapterIndex > 0 && Number.isFinite(target);
  }, [chapterStartsMs, firstMainChapterIndex]);

  const jumpToChapterIndex = useCallback(
    (index: number) => {
      const ms = chapterStartsMs[index];
      const audio = audioRef.current;
      if (!audio || !Number.isFinite(ms)) return false;
      audio.currentTime = Math.max(0, (ms as number) / 1000);
      setShowChapters(false);
      return true;
    },
    [chapterStartsMs],
  );

  const seekToMs = useCallback((ms: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(ms)) return false;
    audio.currentTime = Math.max(0, ms / 1000);
    setShowChapters(false);
    return true;
  }, []);

  const skipIntro = useCallback(() => {
    jumpToChapterIndex(firstMainChapterIndex);
  }, [firstMainChapterIndex, jumpToChapterIndex]);

  const fmt = useCallback((ms?: number | null) => {
    const totalSeconds = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    const minutes = Math.floor((totalSeconds / 60) % 60).toString().padStart(2, "0");
    const hours = Math.floor(totalSeconds / 3600);
    return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ ms?: number; chapterIndex?: number }>).detail ?? {};
      if (typeof detail.ms === "number" && seekToMs(detail.ms)) return;
      if (typeof detail.chapterIndex === "number" && jumpToChapterIndex(detail.chapterIndex)) return;
      skipIntro();
    };
    window.addEventListener(SKIP_META_EVENT, handler);
    window.parettoNarrator = {
      ...(window.parettoNarrator ?? {}),
      skipMetaIntro: (opts?: { ms?: number; chapterIndex?: number }) => {
        if (opts?.ms !== undefined && seekToMs(opts.ms)) return;
        if (opts?.chapterIndex !== undefined && jumpToChapterIndex(opts.chapterIndex)) return;
        skipIntro();
      },
      hasSkippableIntro: canSkipIntro,
      chapters: chapterCount,
    };
    return () => {
      window.removeEventListener(SKIP_META_EVENT, handler);
      if (window.parettoNarrator) {
        delete window.parettoNarrator.skipMetaIntro;
        delete window.parettoNarrator.hasSkippableIntro;
        delete window.parettoNarrator.chapters;
        if (Object.keys(window.parettoNarrator).length === 0) {
          window.parettoNarrator = undefined;
        }
      }
    };
  }, [jumpToChapterIndex, seekToMs, skipIntro, canSkipIntro, chapterCount]);

  if (!item) return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando resumo...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Voltar para a biblioteca */}
      <a href="/library" className="fixed left-3 top-3 z-50 opacity-90 hover:opacity-100" aria-label="Voltar para a biblioteca" title="Voltar para a biblioteca">
        <Button
          size="sm"
          variant="outline"
          className="rounded-full bg-black/60 text-white border-white/20 p-0 h-9 w-9 flex items-center justify-center"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </a>

      {showPdf && item?.pdfUrl ? (
        <div className="absolute inset-0 overflow-auto flex items-center justify-center">
          <div
            style={{
              transform: `scale(${pdfScale})`,
              transformOrigin: 'center center',
              width: '100%',
              height: '100%',
            }}
          >
            <object
              data={`/api/item/pdf?slug=${encodeURIComponent(slug)}#toolbar=0&navpanes=0&scrollbar=1`}
              type="application/pdf"
              className="w-full h-full"
              onError={() => setShowPdf(false)}
            />
          </div>
        </div>
      ) : (
        <div ref={containerRef} className="absolute inset-0 overflow-y-auto">
          <div className={`mx-auto max-w-3xl p-6 text-card-foreground ${readerTheme === 'sepia' ? 'bg-[#F6F0E6] text-[#2B2A28]' : readerTheme === 'light' ? 'bg-white text-black' : 'bg-[#0B0B0F] text-white'}`} style={{ fontSize: `${scale}rem`, lineHeight: 1.9 }}>
            {sections.length === 0 ? (
              <div className="py-16 text-center opacity-80">
                <p>Conteudo indisponivel para este item.</p>
                <p className="text-sm">Tente alternar para PDF (se existir) ou volte para a biblioteca.</p>
              </div>
            ) : (
              <>
                <div className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] opacity-60">{chapterCountLabel}</div>
                {sections.map((s, i: number) => (
                  <section key={i} data-sec={i} className="mb-8">
                    {s.heading ? <h2 className="text-lg font-semibold mb-3 heading">{s.heading}</h2> : null}
                    <WordWrapped contentHtml={s.contentHtml ?? ''} secIndex={i} />
                  </section>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Minimal floating player that auto-hides */}
      <div className="fixed z-50 bottom-2 right-2 sm:bottom-3 sm:right-3 opacity-80 hover:opacity-100 transition-opacity max-w-[95vw] overflow-x-auto">
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-1 sm:gap-2 rounded-2xl sm:rounded-full bg-black/80 text-white shadow-lg backdrop-blur px-2 py-2 sm:px-3 sm:py-2 text-xs sm:text-sm">
          <Button
            size="sm"
            variant="outline"
            className="h-10 sm:h-9 px-3 text-xs sm:text-sm"
            onClick={() => {
              const a = audioRef.current; if (!a) return;
              if (a.paused) a.play(); else a.pause();
            }}
            aria-label={isPaused ? 'Reproduzir áudio' : 'Pausar áudio'}
          >
            {isPaused ? 'Play' : 'Pause'}
          </Button>
          <Button size="sm" variant="outline" className="h-10 sm:h-9 px-2 text-xs" aria-label="Voltar 10 segundos" onClick={()=>{ const a=audioRef.current; if(!a) return; a.currentTime = Math.max(0, a.currentTime - 10); }}>-10s</Button>
          <Button size="sm" variant="outline" className="h-10 sm:h-9 px-2 text-xs" aria-label="Avançar 10 segundos" onClick={()=>{ const a=audioRef.current; if(!a) return; a.currentTime = a.currentTime + 10; }}>+10s</Button>
          {canSkipIntro && (
            <Button
              size="sm"
              variant="outline"
              className="h-10 sm:h-9 px-2 text-xs"
              onClick={skipIntro}
              aria-label="Pular introducao"
            >
              Pular intro
            </Button>
          )}
          {chapterCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="h-10 sm:h-9 px-2 text-xs"
              onClick={() => setShowChapters((value) => !value)}
              aria-label="Ver capitulos"
            >
              Capitulos ({chapterCount})
            </Button>
          )}
          <div className="flex items-center gap-1">
            <span className="text-xs">Vel</span>
            <Button size="sm" variant="outline" className="h-10 sm:h-9 px-2" onClick={()=>{ const a=audioRef.current; if(!a) return; const v=Math.max(0.5, Math.round((a.playbackRate-0.25)*100)/100); a.playbackRate=v; setSpeed(v); }} aria-label="Diminuir velocidade">-</Button>
            <span className="w-9 sm:w-10 text-center text-xs">{speed.toFixed(2)}x</span>
            <Button size="sm" variant="outline" className="h-10 sm:h-9 px-2" onClick={()=>{ const a=audioRef.current; if(!a) return; const v=Math.min(3, Math.round((a.playbackRate+0.25)*100)/100); a.playbackRate=v; setSpeed(v); }} aria-label="Aumentar velocidade">+</Button>
            <label htmlFor="keepPitch" className="ml-1 sm:ml-2 inline-flex items-center gap-1 cursor-pointer">
              <input
                id="keepPitch"
                type="checkbox"
                checked={keepPitch}
                onChange={(e)=>{
                  setKeepPitch(e.target.checked);
                  const el = audioRef.current as (HTMLAudioElement & { preservesPitch?: boolean; mozPreservesPitch?: boolean; webkitPreservesPitch?: boolean }) | null;
                  if (el) {
                    if ("preservesPitch" in el) el.preservesPitch = e.target.checked;
                    if ("mozPreservesPitch" in el) el.mozPreservesPitch = !!e.target.checked;
                    if ("webkitPreservesPitch" in el) el.webkitPreservesPitch = !!e.target.checked;
                  }
                }}
                className="w-4 h-4"
              />
              <span className="text-xs">Tom</span>
            </label>
          </div>
          {/* Divider */}
          <div className="mx-1 h-4 sm:h-5 w-px bg-white/30" />
          {/* Mode toggle */}
          <Button
            size="sm"
            variant="outline"
            className="h-10 sm:h-9 px-2 text-xs"
            onClick={() => {
              if (!item?.pdfUrl) return;
              setShowPdf((value) => !value);
            }}
            disabled={!item?.pdfUrl}
            aria-label={showPdf ? 'Mudar para modo texto' : 'Mudar para modo PDF'}
          >
            {showPdf ? 'PDF' : 'TXT'}
          </Button>

          {/* Zoom controls depend on mode */}

          {showPdf ? (
            <div className="flex items-center gap-1">
              <span className="text-xs">Zoom</span>
              <Button size="sm" variant="outline" className="h-10 sm:h-9 px-2" onClick={()=> setPdfScale(v=> Math.max(0.5, Math.round((v-0.1)*10)/10))} aria-label="Diminuir zoom">-</Button>
              <span className="w-9 sm:w-10 text-center text-xs">{pdfScale.toFixed(1)}x</span>
              <Button size="sm" variant="outline" className="h-10 sm:h-9 px-2" onClick={()=> setPdfScale(v=> Math.min(2.5, Math.round((v+0.1)*10)/10))} aria-label="Aumentar zoom">+</Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-xs">A+</span>
              <Button size="sm" variant="outline" className="h-10 sm:h-9 px-2" onClick={()=> setScale(v=> Math.max(0.8, Math.round((v-0.1)*10)/10))} aria-label="Diminuir tamanho fonte">-</Button>
              <span className="w-9 sm:w-10 text-center text-xs">{scale.toFixed(1)}x</span>
              <Button size="sm" variant="outline" className="h-10 sm:h-9 px-2" onClick={()=> setScale(v=> Math.min(2.0, Math.round((v+0.1)*10)/10))} aria-label="Aumentar tamanho fonte">+</Button>
            </div>
          )}
          {/* Theme for text */}
          {!showPdf && (
            <div className="flex items-center gap-1">
              <span className="text-xs">Cor</span>
              <Button size="sm" variant={readerTheme==='light'?'default':'outline'} className="h-10 sm:h-9 px-2 text-xs" onClick={()=>setReaderTheme('light')} aria-label="Tema claro">CL</Button>
              <Button size="sm" variant={readerTheme==='sepia'?'default':'outline'} className="h-10 sm:h-9 px-2 text-xs" onClick={()=>setReaderTheme('sepia')} aria-label="Tema sepia">SP</Button>
              <Button size="sm" variant={readerTheme==='dark'?'default':'outline'} className="h-10 sm:h-9 px-2 text-xs" onClick={()=>setReaderTheme('dark')} aria-label="Tema escuro">DK</Button>
            </div>
          )}
        </div>
      </div>
      {showChapters && chapterCount > 0 && (
        <div className="fixed z-[60] bottom-16 right-3 w-[min(92vw,420px)] max-h-[60vh] overflow-auto rounded-xl border border-white/15 bg-black/80 text-white shadow-xl backdrop-blur p-2">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="text-xs opacity-80">Capitulos e marcacoes
              <span className="ml-2 text-[10px] uppercase tracking-[0.12em] opacity-70">{chapterCountLabel}</span>
            </div>
            <Button size="sm" variant="outline" className="h-9 px-2 text-xs" onClick={() => setShowChapters(false)} aria-label="Fechar lista de capítulos">
              Fechar
            </Button>
          </div>
          <ul className="divide-y divide-white/10">
            {Array.from({ length: chapterCount }, (_, index) => {
              const ms = chapterStartsMs[index];
              const heading = sections[index]?.heading || `Secao ${index + 1}`;
              const canJump = Number.isFinite(ms);
              return (
                <li key={index} className="flex items-center justify-between gap-3 px-2 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm">{heading}</div>
                    <div className="text-[11px] opacity-70">{canJump ? `-> ${fmt(ms)}` : "sem marcacao"}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[10px]"
                      disabled={!canJump}
                      onClick={() => jumpToChapterIndex(index)}
                    >
                      Ir
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function WordWrapped({ contentHtml, secIndex }: { contentHtml: string; secIndex: number }) {
  const plain = (contentHtml || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = plain.split(' ').filter(Boolean);
  return (
    <p>
      {words.map((w, i) => (
        <span key={i} data-w={i} className="transition-colors" data-sec={secIndex}>
          {w}{' '}
        </span>
      ))}
      <style>{`[data-current-word='1']{ background: color-mix(in oklab, var(--accent) 40%, transparent); border-radius: 4px; }`}</style>
    </p>
  );
}




