"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export function BackButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      className={[
        // Mobile: large, circular hit area; Desktop: compact with label
        "p-0 h-11 w-11 rounded-full sm:h-8 sm:w-auto sm:px-3",
        "bg-background/70 border border-border/70 backdrop-blur hover:bg-secondary/60",
        className,
      ].filter(Boolean).join(" ")}
      aria-label="Voltar"
      title="Voltar"
      onClick={() => {
        try {
          if (typeof window !== "undefined") {
            const path = window.location.pathname || "";
            if (path.startsWith("/library")) {
              router.push("/#hero");
              return;
            }
            if (window.history.length > 1) {
              router.back();
              return;
            }
          }
          router.push("/");
        } catch {
          router.push("/");
        }
      }}
    >
      {/* Icon centered on mobile, label visible on larger screens */}
      <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-1" />
      <span className="hidden sm:inline">Voltar</span>
    </Button>
  );
}
