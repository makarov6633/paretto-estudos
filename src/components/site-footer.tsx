export function SiteFooter() {
  return (
    <footer className="border-t py-6 text-center text-sm text-muted-foreground">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center space-y-2">
          <p>© {new Date().getFullYear()} Paretto Estudos. Todos os direitos reservados.</p>
          <p className="text-xs">Aprenda 95% do conteúdo em 20% do tempo.</p>
        </div>
      </div>
    </footer>
  );
}
