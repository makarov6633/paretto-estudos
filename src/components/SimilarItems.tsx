"use client";

import { useEffect, useState } from "react";
import { ItemCard } from "./ItemCard";
import type { Item } from "@/types";
import { Sparkles } from "lucide-react";

interface SimilarItemsProps {
  itemId: string;
}

export function SimilarItems({ itemId }: SimilarItemsProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        const response = await fetch(
          `/api/similar-items?itemId=${encodeURIComponent(itemId)}&limit=6`
        );
        if (response.ok) {
          const data = await response.json();
          setItems(data.items || []);
        }
      } catch (error) {
        console.error("Failed to fetch similar items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilar();
  }, [itemId]);

  if (loading || items.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-accent/20">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl sm:text-2xl font-semibold">
            Quem leu este também leu
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
