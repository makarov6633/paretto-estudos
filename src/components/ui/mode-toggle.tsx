"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const THEME_OPTIONS = [
  { key: "light", label: "Modo claro", icon: Sun },
  { key: "dark", label: "Modo escuro", icon: Moon },
  { key: "system", label: "Seguir sistema", icon: Monitor },
] as const;

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative overflow-hidden border-white/20 bg-black/60 text-white transition-colors hover:bg-white/10"
          aria-label="Alternar tema"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-amber-400/20" />
          <Sun className="relative h-[1.2rem] w-[1.2rem] scale-100 rotate-0 text-emerald-200 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 text-amber-200 transition-all dark:scale-100 dark:rotate-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52 rounded-2xl border border-white/10 bg-black/90 px-2 py-2 text-neutral-100 shadow-lg"
      >
        {THEME_OPTIONS.map(({ key, label, icon: Icon }) => {
          const active = resolvedTheme === key;
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => setTheme(key)}
              data-active={active}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-200 transition-colors data-[active=true]:bg-emerald-500/15 data-[active=true]:text-emerald-100 hover:bg-white/10"
            >
              <Icon className="h-4 w-4" />
              {label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
