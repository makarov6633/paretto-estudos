"use client";

import { useState } from "react";
import { Keyboard, X } from "lucide-react";
import { Button } from "./ui/button";

const SHORTCUTS = [
  { keys: ["T"], action: "Abrir/fechar índice" },
  { keys: ["S"], action: "Abrir/fechar configurações" },
  { keys: ["←", "→"], action: "Navegar entre seções" },
  { keys: ["Ctrl", "+"], action: "Aumentar fonte" },
  { keys: ["Ctrl", "-"], action: "Diminuir fonte" },
  { keys: ["Esc"], action: "Fechar painéis" },
  { keys: ["?"], action: "Mostrar atalhos" },
];

export function KeyboardShortcutsPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-40"
        aria-label="Atalhos de teclado"
      >
        <Keyboard className="w-4 h-4 mr-2" />
        Atalhos
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Atalhos de Teclado</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {SHORTCUTS.map((shortcut, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <span className="text-sm text-muted-foreground">
                    {shortcut.action}
                  </span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, i) => (
                      <kbd
                        key={i}
                        className="px-2 py-1 text-xs font-mono bg-secondary border border-border rounded"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-muted-foreground text-center">
              Pressione <kbd className="px-1 bg-secondary border border-border rounded">?</kbd> a qualquer momento para ver os atalhos
            </p>
          </div>
        </div>
      )}
    </>
  );
}
