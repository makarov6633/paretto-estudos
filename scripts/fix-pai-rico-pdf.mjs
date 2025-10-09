import "dotenv/config";
import postgres from "postgres";

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const sql = postgres(url, {max:1});

console.log('🔧 Corrigindo pdfUrl de Pai Rico Pai Pobre...\n');

// Corrigir o pdfUrl
await sql`
  UPDATE item
  SET "pdfUrl" = '/media/pdf/pai-rico-pai-pobre-resumo-completo.pdf'
  WHERE slug = 'pai-rico-pai-pobre-resumo-completo'
`;

// Verificar
const result = await sql`
  SELECT slug, title, "pdfUrl"
  FROM item
  WHERE slug = 'pai-rico-pai-pobre-resumo-completo'
`;

console.log('✅ Corrigido:');
console.log(result[0]);

await sql.end();
