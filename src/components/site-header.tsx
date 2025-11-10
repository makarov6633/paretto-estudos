"use client";

import Link from "next/link";
import { UserProfile } from "@/components/auth/user-profile";
import { ModeToggle } from "./ui/mode-toggle";
import { Sparkles, Menu, Trophy, User } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "" || pathname == null;
  return (
    <header className="sticky top-0 z-40 border-b bg-background/70 supports-[backdrop-filter]:bg-background/60 backdrop-blur">
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {!isHome && <BackButton />}
          <h1 className="heading text-base sm:text-xl md:text-2xl font-bold tracking-tight min-w-0">
            <Link
              href="/"
              className="flex items-center gap-1.5 sm:gap-2 no-underline text-foreground transition-colors hover:text-primary touch-manipulation min-w-0"
            >
              <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-emerald-500/15 shadow-sm shrink-0">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-300" />
              </div>
              <span className="bg-gradient-to-r from-emerald-200 via-emerald-300 to-amber-300 bg-clip-text text-transparent font-extrabold truncate">
                Paretto Estudos
              </span>
            </Link>
          </h1>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-5 text-sm md:flex">
          <Link
            href="/library"
            prefetch
            aria-current={pathname?.startsWith("/library") ? "page" : undefined}
            className="no-underline text-foreground/80 transition-colors hover:text-foreground data-[active=true]:text-foreground"
            data-active={pathname?.startsWith("/library") ? "true" : undefined}
          >
            Biblioteca
          </Link>
          <Link
            href="/leaderboard"
            prefetch
            aria-current={pathname?.startsWith("/leaderboard") ? "page" : undefined}
            className="no-underline text-foreground/80 transition-colors hover:text-foreground data-[active=true]:text-foreground flex items-center gap-1"
            data-active={pathname?.startsWith("/leaderboard") ? "true" : undefined}
          >
            <Trophy className="w-4 h-4" />
            Ranking
          </Link>
          <Link
            href="/profile"
            prefetch
            aria-current={pathname?.startsWith("/profile") ? "page" : undefined}
            className="no-underline text-foreground/80 transition-colors hover:text-foreground data-[active=true]:text-foreground flex items-center gap-1"
            data-active={pathname?.startsWith("/profile") ? "true" : undefined}
          >
            <User className="w-4 h-4" />
            Progresso
          </Link>
          <Link
            href="/requests"
            prefetch
            aria-current={pathname?.startsWith("/requests") ? "page" : undefined}
            className="no-underline text-foreground/80 transition-colors hover:text-foreground data-[active=true]:text-foreground"
            data-active={pathname?.startsWith("/requests") ? "true" : undefined}
          >
            Solicitacoes
          </Link>
        </nav>

        {/* Right side / Mobile menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <UserProfile />
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="md:hidden h-8 w-8 sm:h-9 sm:w-9 p-0 touch-manipulation">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/library" prefetch className="w-full no-underline">
                  Biblioteca
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/leaderboard" prefetch className="w-full no-underline flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Ranking
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile" prefetch className="w-full no-underline flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Progresso
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/requests" prefetch className="w-full no-underline">
                  Solicitacoes
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/plans" prefetch className="w-full no-underline">
                  Planos
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
