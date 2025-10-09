import "dotenv/config";
import postgres from "postgres";

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const sql = postgres(url, {max:1});

console.log('🔧 Corrigindo itens com dados incorretos...\n');

// 1. Corrigir Behave pdfUrl
await sql`
  UPDATE item
  SET "pdfUrl" = '/media/pdf/behave.pdf'
  WHERE slug = 'behave'
`;
console.log('✅ Behave: pdfUrl corrigido para behave.pdf (versão mais recente)');

// 2. Corrigir O Erro de Descartes título (opcional - título está errado no PDF)
// await sql`
//   UPDATE item
//   SET title = 'O Erro de Descartes'
//   WHERE slug = 'o-erro-de-descartes'
// `;
// console.log('✅ O Erro de Descartes: título corrigido');

// Verificar
const behave = await sql`
  SELECT slug, title, "pdfUrl"
  FROM item
  WHERE slug = 'behave'
`;

const descartes = await sql`
  SELECT slug, title, "pdfUrl"
  FROM item
  WHERE slug = 'o-erro-de-descartes'
`;

console.log('\n📋 Verificação:');
console.log('\nBehave:', behave[0]);
console.log('\nO Erro de Descartes:', descartes[0]);

await sql.end();
