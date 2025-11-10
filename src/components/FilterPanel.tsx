"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, X } from "lucide-react";
import { Button } from "./ui/button";

const POPULAR_TAGS = [
  "Psicologia",
  "Finanças",
  "Neurociência",
  "Filosofia",
  "História",
  "Economia",
  "Autoajuda",
  "Ciência",
];

const DURATION_FILTERS = [
  { label: "Curto (< 15 min)", min: 0, max: 15 },
  { label: "Médio (15-30 min)", min: 15, max: 30 },
  { label: "Longo (> 30 min)", min: 30, max: 999 },
];

export function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTag, setSelectedTag] = useState(searchParams.get("tag") || "");
  const [selectedDuration, setSelectedDuration] = useState<string>("");

  useEffect(() => {
    const minMinutes = searchParams.get("minMinutes");
    const maxMinutes = searchParams.get("maxMinutes");
    if (minMinutes && maxMinutes) {
      const duration = DURATION_FILTERS.find(
        (d) => d.min === parseInt(minMinutes) && d.max === parseInt(maxMinutes)
      );
      if (duration) {
        setSelectedDuration(duration.label);
      }
    }
  }, [searchParams]);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (selectedTag) {
      params.set("tag", selectedTag);
    } else {
      params.delete("tag");
    }
    
    if (selectedDuration) {
      const duration = DURATION_FILTERS.find((d) => d.label === selectedDuration);
      if (duration) {
        params.set("minMinutes", duration.min.toString());
        params.set("maxMinutes", duration.max.toString());
      }
    } else {
      params.delete("minMinutes");
      params.delete("maxMinutes");
    }
    
    const newUrl = params.toString() ? `/library?${params.toString()}` : "/library";
    router.push(newUrl);
  };

  const clearFilters = () => {
    setSelectedTag("");
    setSelectedDuration("");
    router.push("/library");
  };

  const hasActiveFilters = selectedTag || selectedDuration;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowFilters(!showFilters)}
        className="relative"
      >
        <Filter className="w-4 h-4 mr-2" />
        Filtros
        {hasActiveFilters && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />
        )}
      </Button>

      {showFilters && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Filtros</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Categoria</label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag === selectedTag ? "" : tag)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      selectedTag === tag
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Duração de Leitura
              </label>
              <div className="space-y-2">
                {DURATION_FILTERS.map((duration) => (
                  <label
                    key={duration.label}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="duration"
                      checked={selectedDuration === duration.label}
                      onChange={() =>
                        setSelectedDuration(
                          selectedDuration === duration.label ? "" : duration.label
                        )
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{duration.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={applyFilters}
                className="flex-1"
                size="sm"
              >
                Aplicar
              </Button>
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
