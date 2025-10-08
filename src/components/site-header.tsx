"use client";

import Link from "next/link";
import { UserProfile } from "@/components/auth/user-profile";
import { ModeToggle } from "./ui/mode-toggle";
import { Sparkles, Menu } from "lucide-react";
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
      <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-3">
          {!isHome && <BackButton />}
          <h1 className="heading text-2xl font-bold tracking-tight">
            <Link
              href="/"
              className="flex items-center gap-2 no-underline text-foreground transition-colors hover:text-primary"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 shadow-sm">
                <Sparkles className="h-5 w-5 text-emerald-300" />
              </div>
              <span className="bg-gradient-to-r from-emerald-200 via-emerald-300 to-amber-300 bg-clip-text text-transparent font-extrabold">
                Paretto Estudos
              </span>
            </Link>
          </h1>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-6 text-sm md:flex">
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
        <div className="flex items-center gap-3">
          <UserProfile />
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild>
                <Link href="/library" prefetch className="w-full no-underline">
                  Biblioteca
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/requests" prefetch className="w-full no-underline">
                  Solicitacoes
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile" prefetch className="w-full no-underline">
                  Perfil
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
