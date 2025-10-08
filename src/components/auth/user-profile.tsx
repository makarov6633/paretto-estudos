"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { SignInButton } from "./sign-in-button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function UserProfile() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [status, setStatus] = useState<{
    plan: "premium" | "free" | "guest";
    currentPeriodEnd?: string | null;
    usage?: number;
    limit?: number;
  } | null>(null);

  useEffect(() => {
    if (!session) {
      setStatus(null);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/account/status", { cache: "no-store" });
        const json = await res.json();
        setStatus({
          plan: json.plan,
          currentPeriodEnd: json.currentPeriodEnd
            ? new Date(json.currentPeriodEnd).toISOString()
            : null,
          usage: json.usage,
          limit: json.limit,
        });
      } catch {
        setStatus(null);
      }
    })();
  }, [session]);

  if (isPending) {
    return <div>Carregando...</div>;
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <SignInButton />
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-8 cursor-pointer ring-2 ring-emerald-500/40 transition-transform duration-200 hover:scale-105">
          <AvatarImage
            src={session.user?.image || ""}
            alt={session.user?.name || "Usuário"}
            referrerPolicy="no-referrer"
          />
          <AvatarFallback>
            {(
              session.user?.name?.[0] ||
              session.user?.email?.[0] ||
              "U"
            ).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-2xl border border-white/10 bg-black/90 text-neutral-100 shadow-lg">
        <DropdownMenuLabel className="font-normal pb-3 border-b border-white/10">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-semibold leading-none tracking-tight">
              {session.user?.name}
            </p>
            <p className="text-xs leading-none text-neutral-400">
              {session.user?.email}
            </p>
            {status?.plan === "premium" ? (
              <div className="pt-1">
                <Badge className="text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                  Plano ativo
                  {status.currentPeriodEnd
                    ? ` • vigente até ${new Date(status.currentPeriodEnd).toLocaleDateString("pt-BR")}`
                    : ""}
                </Badge>
              </div>
            ) : status?.plan === "free" ? (
              <div className="pt-1">
                <Badge variant="outline" className="text-xs border-amber-400/40 text-amber-200">
                  Grátis • {status.usage ?? 0}/{status.limit ?? 5} no mês
                </Badge>
              </div>
            ) : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem className="rounded-lg bg-emerald-500/15 text-emerald-100 focus:bg-emerald-500/25" asChild>
          <Link href="/profile" className="flex items-center gap-2 no-underline" >
            <User className="mr-2 h-4 w-4" />
            Seu perfil
          </Link>
        </DropdownMenuItem>
        {status?.plan === "premium" && (
          <DropdownMenuItem className="rounded-lg hover:bg-white/10" asChild>
            <Link href="/plans" className="flex items-center gap-2 no-underline">
              Gerenciar assinatura
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem onClick={handleSignOut} className="rounded-lg text-red-200 hover:bg-red-500/10">
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
