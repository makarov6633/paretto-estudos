"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Item } from "@/types";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Maximize2, Minimize2, Type, BookOpen } from "lucide-react";
import { useSession } from "@/lib/auth-client";

type FullItem = Item & {
  pdfUrl?: string | null;
  sections?: Array<{ 
    orderIndex: number; 
    heading?: string | null; 
    contentHtml?: string | null;
  }>;
};

async function fetchItem(slug: string): Promise<FullItem | null> {
  const url = new URL(`/api/items?slug=${encodeURIComponent(slug)}&expand=full`, window.location.origin);
  const data = await fetch(url.toString()).then((r) => r.json());
  return (data.items?.[0] as FullItem) ?? null;
}

export default function ReadPage() {
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<FullItem | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [maxWidth, setMaxWidth] = useState<'narrow' | 'medium' | 'wide' | 'full'>('medium');
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('sepia');
  const [showPdf, setShowPdf] = useState(false);
  const [pdfScale, setPdfScale] = useState(1.0);
  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    if (!slug) return;
    fetchItem(slug as string).then((it) => setItem(it));
  }, [slug]);

  useEffect(() => {
    const saved = localStorage.getItem('reader-preferences');
    if (saved) {
      try {
        const prefs = JSON.parse(saved);
        if (prefs.fontSize) setFontSize(prefs.fontSize);
        if (prefs.lineHeight) setLineHeight(prefs.lineHeight);
        if (prefs.maxWidth) setMaxWidth(prefs.maxWidth);
        if (prefs.theme) setTheme(prefs.theme);
      } catch (e) {
        console.error('Failed to load preferences', e);
      }
    }
  }, []);

  useEffect(() => {
    const prefs = { fontSize, lineHeight, maxWidth, theme };
    localStorage.setItem('reader-preferences', JSON.stringify(prefs));
  }, [fontSize, lineHeight, maxWidth, theme]);

  const scrollToSection = useCallback((index: number) => {
    const el = document.getElementById(`section-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShowToc(false);
    }
  }, []);

  if (!item) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando resumo...</p>
        </div>
      </div>
    );
  }

  const sections = item.sections ?? [];
  
  const themeStyles = {
    light: {
      bg: '#ffffff',
      text: '#000000',
      secondary: '#666666',
    },
    sepia: {
      bg: '#f4ecd8',
      text: '#5f4b32',
      secondary: '#8b7355',
    },
    dark: {
      bg: '#1a1a1a',
      text: '#e8e6e3',
      secondary: '#a8a29e',
    },
  };

  const widthMap = {
    narrow: '560px',
    medium: '680px',
    wide: '860px',
    full: '100%',
  };

  const currentTheme = themeStyles[theme];

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ 
        backgroundColor: currentTheme.bg,
        color: currentTheme.text,
      }}
    >
      {/* Header */}
      <header 
        className="sticky top-0 z-50 border-b backdrop-blur-sm"
        style={{
          backgroundColor: `${currentTheme.bg}f0`,
          borderBottomColor: `${currentTheme.secondary}33`,
        }}
      >
        <div className="container max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <a 
              href="/library" 
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
              aria-label="Voltar para biblioteca"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">Biblioteca</span>
            </a>
            
            <div className="flex-1 text-center min-w-0">
              <h1 className="text-sm sm:text-base font-semibold truncate">{item.title}</h1>
              <p className="text-xs opacity-70 truncate">{item.author}</p>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {item.pdfUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPdf(!showPdf)}
                  className="h-9 px-2 sm:px-3"
                  aria-label={showPdf ? 'Ver texto' : 'Ver PDF'}
                >
                  <BookOpen className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSettings(!showSettings)}
                className="h-9 px-2 sm:px-3"
                aria-label="Configurações de leitura"
              >
                <Type className="w-4 h-4" />
              </Button>
              {sections.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowToc(!showToc)}
                  className="h-9 px-2 sm:px-3"
                  aria-label="Índice"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1 text-xs">Índice</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div 
          className="sticky top-[60px] z-40 border-b shadow-lg"
          style={{
            backgroundColor: currentTheme.bg,
            borderBottomColor: `${currentTheme.secondary}33`,
          }}
        >
          <div className="container max-w-5xl mx-auto px-4 sm:px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Font Size */}
              <div>
                <label className="text-xs font-medium opacity-70 block mb-2">Tamanho</label>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                    className="h-9 px-3"
                  >
                    A-
                  </Button>
                  <span className="text-sm font-medium min-w-[3rem] text-center">{fontSize}px</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                    className="h-9 px-3"
                  >
                    A+
                  </Button>
                </div>
              </div>

              {/* Line Height */}
              <div>
                <label className="text-xs font-medium opacity-70 block mb-2">Espaçamento</label>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLineHeight(Math.max(1.2, lineHeight - 0.2))}
                    className="h-9 px-3"
                  >
                    -
                  </Button>
                  <span className="text-sm font-medium min-w-[3rem] text-center">{lineHeight.toFixed(1)}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLineHeight(Math.min(2.4, lineHeight + 0.2))}
                    className="h-9 px-3"
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Width */}
              <div>
                <label className="text-xs font-medium opacity-70 block mb-2">Largura</label>
                <select
                  value={maxWidth}
                  onChange={(e) => setMaxWidth(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-md border text-sm"
                  style={{
                    backgroundColor: currentTheme.bg,
                    color: currentTheme.text,
                    borderColor: `${currentTheme.secondary}44`,
                  }}
                >
                  <option value="narrow">Estreita</option>
                  <option value="medium">Média</option>
                  <option value="wide">Larga</option>
                  <option value="full">Total</option>
                </select>
              </div>

              {/* Theme */}
              <div>
                <label className="text-xs font-medium opacity-70 block mb-2">Tema</label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={theme === 'light' ? 'default' : 'outline'}
                    onClick={() => setTheme('light')}
                    className="h-9 px-3 flex-1"
                  >
                    Claro
                  </Button>
                  <Button
                    size="sm"
                    variant={theme === 'sepia' ? 'default' : 'outline'}
                    onClick={() => setTheme('sepia')}
                    className="h-9 px-3 flex-1"
                  >
                    Sépia
                  </Button>
                  <Button
                    size="sm"
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => setTheme('dark')}
                    className="h-9 px-3 flex-1"
                  >
                    Escuro
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table of Contents Sidebar */}
      {showToc && (
        <div 
          className="fixed inset-y-0 left-0 z-30 w-80 border-r shadow-2xl overflow-y-auto"
          style={{
            backgroundColor: currentTheme.bg,
            borderRightColor: `${currentTheme.secondary}33`,
            top: '60px',
          }}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Índice</h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowToc(false)}
                className="h-8 px-2"
              >
                ✕
              </Button>
            </div>
            <nav>
              <ul className="space-y-1">
                {sections.map((section, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => scrollToSection(idx)}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-sm"
                    >
                      {section.heading || `Seção ${idx + 1}`}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pb-20">
        {showPdf && item.pdfUrl ? (
          <div className="container mx-auto px-4 py-8">
            <div className="mb-4 flex items-center justify-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPdfScale(Math.max(0.5, pdfScale - 0.1))}
              >
                Zoom -
              </Button>
              <span className="text-sm font-medium">{Math.round(pdfScale * 100)}%</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPdfScale(Math.min(2.0, pdfScale + 0.1))}
              >
                Zoom +
              </Button>
            </div>
            <div className="flex justify-center">
              <iframe
                src={item.pdfUrl}
                className="border rounded-lg shadow-lg"
                style={{
                  width: `${100 * pdfScale}%`,
                  height: `${800 * pdfScale}px`,
                  maxWidth: '100%',
                }}
                title={`PDF: ${item.title}`}
              />
            </div>
          </div>
        ) : (
          <article 
            className="mx-auto px-4 sm:px-6 py-8 sm:py-12"
            style={{ 
              maxWidth: widthMap[maxWidth],
              fontSize: `${fontSize}px`,
              lineHeight,
            }}
          >
            {sections.length > 0 ? (
              sections.map((section, idx) => (
                <section 
                  key={idx} 
                  id={`section-${idx}`}
                  className="mb-8 scroll-mt-24"
                >
                  {section.heading && (
                    <h2 
                      className="text-2xl sm:text-3xl font-bold mb-4"
                      style={{ color: currentTheme.text }}
                    >
                      {section.heading}
                    </h2>
                  )}
                  <div
                    className="prose prose-lg max-w-none"
                    style={{ color: currentTheme.text }}
                    dangerouslySetInnerHTML={{ __html: section.contentHtml || '' }}
                  />
                </section>
              ))
            ) : (
              <div className="text-center py-20">
                <p style={{ color: currentTheme.secondary }}>
                  Nenhum conteúdo disponível para este resumo.
                </p>
              </div>
            )}
          </article>
        )}
      </main>

      {/* Custom Styles */}
      <style jsx global>{`
        .prose p {
          margin-bottom: 1.25em;
        }
        .prose blockquote {
          border-left: 4px solid ${currentTheme.secondary};
          padding-left: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          opacity: 0.9;
        }
        .prose a {
          color: ${currentTheme.text};
          text-decoration: underline;
          text-decoration-color: ${currentTheme.secondary};
        }
        .prose a:hover {
          opacity: 0.7;
        }
        .prose ul, .prose ol {
          margin: 1.25em 0;
          padding-left: 1.5em;
        }
        .prose li {
          margin: 0.5em 0;
        }
        .prose strong {
          font-weight: 600;
          color: ${currentTheme.text};
        }
        .prose em {
          font-style: italic;
        }
        .prose h3, .prose h4, .prose h5, .prose h6 {
          margin-top: 2em;
          margin-bottom: 1em;
          font-weight: 600;
          color: ${currentTheme.text};
        }
        
        /* Scrollbar customization */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: ${currentTheme.bg};
        }
        ::-webkit-scrollbar-thumb {
          background: ${currentTheme.secondary}44;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${currentTheme.secondary}66;
        }
      `}</style>
    </div>
  );
}
