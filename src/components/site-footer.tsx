export function SiteFooter() {
  return (
    <footer className="border-t bg-background/60 supports-[backdrop-filter]:bg-background/50 backdrop-blur">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8">
        <div className="flex flex-col items-center gap-2 sm:gap-3 text-center">
          <p className="heading text-base sm:text-lg text-foreground/90 font-semibold">
            Paretto Estudos
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            © {new Date().getFullYear()} Todos os direitos reservados.
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Aprenda 95% do conteúdo em 20% do tempo.
          </p>
        </div>
      </div>
    </footer>
  );
}
