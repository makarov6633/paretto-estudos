"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      
      if (query.trim()) {
        params.set("q", query.trim());
      } else {
        params.delete("q");
      }
      
      const newUrl = params.toString() ? `/library?${params.toString()}` : "/library";
      router.push(newUrl);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, router, searchParams]);

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por título ou autor..."
        className="h-10 sm:h-11 w-full rounded-md border border-border bg-card pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary touch-manipulation"
      />
    </div>
  );
}
