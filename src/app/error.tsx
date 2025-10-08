"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log to console for quick diagnosis in dev
    // In production, you could post to an error endpoint here
    console.error("App error boundary:", error);
  }, [error]);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Algo deu errado</h1>
      <p style={{ marginTop: 8, color: "#888" }}>
        Ocorreu um erro ao renderizar esta página. Tente novamente.
      </p>
      <button
        onClick={() => reset()}
        style={{ marginTop: 16, padding: "8px 12px", borderRadius: 6, border: "1px solid #444" }}
      >
        Recarregar
      </button>
    </div>
  );
}
