"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { ItemCard } from "./ItemCard";
import type { ContinueReadingItem } from "@/types";
import { BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";

export function ContinueReading() {
  const { data: session } = useSession();
  const [items, setItems] = useState<ContinueReadingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    const fetchContinueReading = async () => {
      try {
        const response = await fetch('/api/continue-reading?limit=6');
        if (response.ok) {
          const data = await response.json();
          setItems(data.items || []);
        }
      } catch (error) {
        console.error('Failed to fetch continue reading items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContinueReading();
  }, [session]);

  if (!session?.user || loading) {
    return null;
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Continuar Lendo</h2>
        </div>
        <Link 
          href="#" 
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          Ver todos
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => (
          <div key={item.id} className="relative">
            <ItemCard item={item} />
            <div className="mt-2">
              <div className="w-full bg-secondary/20 rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${item.scrollProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(item.scrollProgress)}% concluído
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
