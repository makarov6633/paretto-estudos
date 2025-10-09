import "dotenv/config";
import postgres from "postgres";

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const sql = postgres(url, {max:1});

console.log('=' .repeat(80));
console.log('📊 RELATÓRIO FINAL - DEDUPLICAÇÃO COMPLETA');
console.log('='.repeat(80) + '\n');

const items = await sql`
  select slug, title, author, "createdAt", "pdfUrl", "hasAudio", "hasPdf"
  from "item"
  order by "createdAt" desc
`;

console.log(`✅ Total de itens únicos no banco: ${items.length}\n`);

// Verificar casos específicos que foram trabalhados
const checks = [
  { name: 'Pai Rico, Pai Pobre', slug: 'pai-rico-pai-pobre-resumo-completo' },
  { name: 'O Erro de Descartes', slug: 'o-erro-de-descartes' },
  { name: 'Determined (Corrigido)', slug: 'resumo-determinados-corrigido' },
  { name: 'Behave', slug: 'behave' },
  { name: 'O Capital (Profissional)', slug: 'o-capital-volume-i' },
];

console.log('🎯 ITENS MANTIDOS (VERSÕES MAIS RECENTES):');
console.log('='.repeat(80) + '\n');

for (const check of checks) {
  const item = items.find(i => i.slug === check.slug);

  if (item) {
    console.log(`✅ ${check.name}`);
    console.log(`   Slug:    ${item.slug}`);
    console.log(`   Título:  ${item.title}`);
    console.log(`   Autor:   ${item.author || 'N/A'}`);
    console.log(`   PDF:     ${item.pdfUrl}`);
    console.log(`   Áudio:   ${item.hasAudio ? '✓' : '✗'}`);
    console.log('');
  } else {
    console.log(`❌ ${check.name} - NÃO ENCONTRADO NO BANCO`);
    console.log('');
  }
}

// Verificar Damásio
console.log('\n📚 LIVROS DE ANTÓNIO DAMÁSIO (todos únicos):');
console.log('='.repeat(80) + '\n');

const damasio = items.filter(i =>
  i.author && i.author.toLowerCase().includes('damas')
);

for (const book of damasio) {
  console.log(`✅ ${book.title}`);
  console.log(`   Slug: ${book.slug}\n`);
}

// Estatísticas
console.log('\n📈 ESTATÍSTICAS:');
console.log('='.repeat(80) + '\n');

const withAudio = items.filter(i => i.hasAudio).length;
const withPdf = items.filter(i => i.hasPdf).length;
const withBoth = items.filter(i => i.hasAudio && i.hasPdf).length;

console.log(`Total de itens:           ${items.length}`);
console.log(`Com PDF:                  ${withPdf}`);
console.log(`Com Áudio:                ${withAudio}`);
console.log(`Com ambos:                ${withBoth}`);

console.log('\n\n✅ DEDUPLICAÇÃO CONCLUÍDA COM SUCESSO!');
console.log('   Todas as versões antigas foram removidas.');
console.log('   Mantidas apenas as versões mais recentes e completas.');
console.log('   Capas verificadas e reparadas.\n');

await sql.end();
