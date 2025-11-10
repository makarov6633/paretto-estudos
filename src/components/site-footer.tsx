export function SiteFooter() {
  return (
    <footer className="border-t bg-background/60 supports-[backdrop-filter]:bg-background/50 backdrop-blur">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="heading text-foreground/90 font-semibold">
            Paretto Estudos
          </p>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Aprenda 95% do conteúdo em 20% do tempo.
          </p>
        </div>
      </div>
    </footer>
  );
}
