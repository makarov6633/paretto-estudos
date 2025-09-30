"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const [showPdf] = useState(true);
  const [speed, setSpeed] = useState(1);
  // Minimal dock is always visible (low opacity). We no longer auto-hide fully.
  const [isPaused, setIsPaused] = useState(true);

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
  const track = useMemo(() => item?.audioTracks?.[0], [item]);

  if (!item) return <div className="container mx-auto p-6">Carregando…</div>;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black">
      {/* Voltar à biblioteca - touch-friendly on mobile */}
      <div className="fixed left-3 top-3 z-50 opacity-90 hover:opacity-100">
        <a href="/library" aria-label="Voltar à biblioteca" title="Voltar à biblioteca">
          <Button
            variant="outline"
            className="rounded-full bg-black/60 text-white border-white/30 shadow-lg p-0 h-11 w-11 flex items-center justify-center"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </a>
      </div>
      {/* Voltar à biblioteca */}
      <a href="/library" className="fixed left-3 top-3 z-50 opacity-90 hover:opacity-100">
        <Button
          size="sm"
          variant="outline"
          aria-label="Voltar à biblioteca"
          className="rounded-full bg-black/60 text-white border-white/20 p-0 h-9 w-9 flex items-center justify-center"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </a>
      {/* Optional support chip */}
      <a href="/plans" className="fixed left-3 bottom-3 z-50 opacity-80 hover:opacity-100">
        <Button size="sm" variant="outline" className="rounded-full bg-black/60 text-white border-white/20">Apoiar projeto</Button>
      </a>
      {/* Hidden audio element (we control via our minimal UI) */}
      <audio ref={audioRef} src={track?.audioUrl ?? ''} preload="metadata" onContextMenu={(e)=>e.preventDefault()} />

      {/* Full-bleed reader */}
      {showPdf && item?.pdfUrl ? (
        <div className="absolute inset-0 overflow-auto flex items-center justify-center">
          <div style={{ transform: `scale(${pdfScale})`, transformOrigin: 'center center', width: '100%', height: '100%' }}>
            <object
              data={`/api/item/pdf?slug=${encodeURIComponent(slug)}#toolbar=0&navpanes=0&scrollbar=1`}
              type="application/pdf"
              className="w-full h-full"
            />
          </div>
        </div>
      ) : (
        <div ref={containerRef} className="absolute inset-0 overflow-y-auto">
          <div className={`mx-auto max-w-3xl p-6 text-card-foreground ${readerTheme === 'sepia' ? 'bg-[#F6F0E6] text-[#2B2A28]' : readerTheme === 'light' ? 'bg-white text-black' : 'bg-[#0B0B0F] text-white'}`} style={{ fontSize: `${scale}rem`, lineHeight: 1.9 }}>
            {sections.map((s, i: number) => (
              <section key={i} data-sec={i} className="mb-8">
                {s.heading ? <h2 className="text-lg font-semibold mb-3 heading">{s.heading}</h2> : null}
                <WordWrapped contentHtml={s.contentHtml ?? ''} secIndex={i} />
              </section>
            ))}
          </div>
        </div>
      )}

      {/* Minimal floating player that auto-hides */}
      <div className="fixed z-50 bottom-3 right-3 opacity-80 hover:opacity-100 transition-opacity max-w-[98vw] overflow-x-auto">
        <div className="flex items-center whitespace-nowrap gap-1.5 sm:gap-2 rounded-full bg-black/70 text-white shadow-lg backdrop-blur px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-[11px] md:text-xs">
          <Button
            size="sm"
            variant="outline"
            className="h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs"
            onClick={() => {
              const a = audioRef.current; if (!a) return;
              if (a.paused) a.play(); else a.pause();
            }}
          >
            {isPaused ? 'Play' : 'Pause'}
          </Button>
          <Button size="sm" variant="outline" className="h-7 sm:h-8 px-2 text-[10px] sm:text-xs" aria-label="Voltar 10 segundos" onClick={()=>{ const a=audioRef.current; if(!a) return; a.currentTime = Math.max(0, a.currentTime - 10); }}>-10s</Button>
          <Button size="sm" variant="outline" className="h-7 sm:h-8 px-2 text-[10px] sm:text-xs" aria-label="Avançar 10 segundos" onClick={()=>{ const a=audioRef.current; if(!a) return; a.currentTime = a.currentTime + 10; }}>+10s</Button>
          <div className="flex items-center gap-1">
            Vel
            <Button size="sm" variant="outline" className="h-7 sm:h-8 px-2" onClick={()=>{ const a=audioRef.current; if(!a) return; const v=Math.max(0.5, Math.round((a.playbackRate-0.25)*100)/100); a.playbackRate=v; setSpeed(v); }}>-</Button>
            <span className="w-9 sm:w-10 text-center">{speed.toFixed(2)}x</span>
            <Button size="sm" variant="outline" className="h-7 sm:h-8 px-2" onClick={()=>{ const a=audioRef.current; if(!a) return; const v=Math.min(3, Math.round((a.playbackRate+0.25)*100)/100); a.playbackRate=v; setSpeed(v); }}>+</Button>
            <label className="ml-1 sm:ml-2 inline-flex items-center gap-1">
              <input
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
              />
              Tom
            </label>
          </div>
          {/* Divider */}
          <div className="mx-1 h-4 sm:h-5 w-px bg-white/30" />
          {/* Mode toggle */}
          <Button size="sm" variant="outline" className="h-7 sm:h-8 px-2 text-[10px] sm:text-xs" onClick={()=>{ /* toggle PDF/Text */ }} disabled={!item?.pdfUrl && showPdf}>{showPdf ? 'PDF' : 'TXT'}</Button>
          {/* Zoom controls depend on mode */}
          {showPdf ? (
            <div className="flex items-center gap-1">
              Zoom
              <Button size="sm" variant="outline" className="h-7 sm:h-8 px-2" onClick={()=> setPdfScale(v=> Math.max(0.5, Math.round((v-0.1)*10)/10))}>-</Button>
              <span className="w-9 sm:w-10 text-center">{pdfScale.toFixed(1)}x</span>
              <Button size="sm" variant="outline" className="h-7 sm:h-8 px-2" onClick={()=> setPdfScale(v=> Math.min(2.5, Math.round((v+0.1)*10)/10))}>+</Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              A+
              <Button size="sm" variant="outline" className="h-7 sm:h-8 px-2" onClick={()=> setScale(v=> Math.max(0.8, Math.round((v-0.1)*10)/10))}>-</Button>
              <span className="w-9 sm:w-10 text-center">{scale.toFixed(1)}x</span>
              <Button size="sm" variant="outline" className="h-7 sm:h-8 px-2" onClick={()=> setScale(v=> Math.min(2.0, Math.round((v+0.1)*10)/10))}>+</Button>
            </div>
          )}
          {/* Theme for text */}
          {!showPdf && (
            <div className="flex items-center gap-1">
              Cor
              <Button size="sm" variant={readerTheme==='light'?'default':'outline'} className="h-7 sm:h-8 px-2" onClick={()=>setReaderTheme('light')} aria-label="Tema claro">☀️</Button>
              <Button size="sm" variant={readerTheme==='sepia'?'default':'outline'} className="h-7 sm:h-8 px-2" onClick={()=>setReaderTheme('sepia')} aria-label="Tema sépia">☕</Button>
              <Button size="sm" variant={readerTheme==='dark'?'default':'outline'} className="h-7 sm:h-8 px-2" onClick={()=>setReaderTheme('dark')} aria-label="Tema escuro">🌙</Button>
            </div>
          )}
        </div>
      </div>
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


