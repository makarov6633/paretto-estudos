"use client";

import { signIn, useSession } from "@/lib/auth-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { data: session, isPending } = useSession();

  return (
    <main className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <h1 className="text-4xl font-bold">Entre para o Paretto Estudos</h1>
        <p className="text-muted-foreground">
          Acesse o catálogo gratuito de resumos. Assine para desbloquear Audiobook e Leitura + Áudio.
        </p>
        {session ? (
          <Button asChild size="lg">
            <Link href="/dashboard">Ir ao catálogo</Link>
          </Button>
        ) : (
          <Button
            size="lg"
            disabled={isPending}
            onClick={async () => {
              await signIn.social({ provider: "google", callbackURL: "/dashboard" });
            }}
          >
            Continuar com Google
          </Button>
        )}
        <div className="text-xs text-muted-foreground">
          Ao continuar, você concorda com nossos termos e política de privacidade.
        </div>
      </div>
    </main>
  );
}


