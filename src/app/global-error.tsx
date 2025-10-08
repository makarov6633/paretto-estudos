"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body>
        <div style={{ padding: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Erro inesperado</h1>
          <p style={{ marginTop: 8, color: "#888" }}>
            Encontramos um problema ao carregar o aplicativo. Você pode tentar novamente.
          </p>
          <pre style={{ marginTop: 12, whiteSpace: "pre-wrap", color: "#aaa", fontSize: 12 }}>{error.message}</pre>
          <button
            onClick={() => reset()}
            style={{ marginTop: 16, padding: "8px 12px", borderRadius: 6, border: "1px solid #444" }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}

