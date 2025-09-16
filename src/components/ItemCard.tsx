import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Props = {
  item: {
    id: string;
    slug: string;
    title: string;
    author: string;
    coverImageUrl?: string | null;
    hasAudio: boolean;
    hasPdf: boolean;
    readingMinutes?: number | null;
    audioMinutes?: number | null;
  };
};

export function ItemCard({ item }: Props) {
  return (
    <Card className="overflow-hidden group">
      <Link href={`/item/${item.slug}/read`}>
        <div className="aspect-[1/1] bg-muted flex items-center justify-center overflow-hidden">
          {item.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.coverImageUrl}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="text-muted-foreground">Sem capa</div>
          )}
        </div>
      </Link>
      <CardHeader className="space-y-1">
        <h3 className="font-semibold leading-tight line-clamp-2">{item.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-1">{item.author}</p>
      </CardHeader>
      <CardContent className="flex items-center gap-2">
        {item.hasPdf && (
          <Badge variant="secondary">Leitura</Badge>
        )}
        {item.hasAudio && (
          <Badge>Áudio</Badge>
        )}
        {item.readingMinutes ? (
          <span className="text-xs text-muted-foreground">{item.readingMinutes} min</span>
        ) : null}
      </CardContent>
    </Card>
  );
}


