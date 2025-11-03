export function ItemCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-muted animate-pulse">
      <div className="relative aspect-[3/4] bg-muted-foreground/10" />
      <div className="p-3 sm:p-4 space-y-2">
        <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
        <div className="h-3 bg-muted-foreground/20 rounded w-1/2" />
      </div>
    </div>
  );
}

export function ItemGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 lg:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </div>
  );
}
