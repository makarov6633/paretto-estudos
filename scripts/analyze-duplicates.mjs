import "dotenv/config";
import postgres from "postgres";

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("POSTGRES_URL not set");
  process.exit(1);
}
const sql = postgres(url, { max: 1 });

const items = await sql`
  select slug, title, author, "createdAt", "hasAudio", "hasPdf", "audioMinutes"
  from "item"
  order by "createdAt" desc
`;

console.log('📊 Total de itens:', items.length);
console.log('\n🔍 ANÁLISE DE DUPLICATAS:\n');

// Agrupar por similaridade de título
const groups = new Map();

for (const itm of items) {
  // Normalizar título para detectar duplicatas
  const normalized = itm.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^\w\s]/g, ' ') // remove pontuação
    .replace(/\s+/g, ' ')
    .trim();

  // Extrair palavras-chave principais (ignorar palavras comuns)
  const stopwords = ['resumo', 'completo', 'de', 'do', 'da', 'o', 'a', 'e', 'para', 'vol', 'volume', 'livro', 'capitulo'];
  const keywords = normalized.split(' ')
    .filter(w => w.length > 3 && !stopwords.includes(w))
    .sort()
    .join(' ');

  if (!groups.has(keywords)) {
    groups.set(keywords, []);
  }
  groups.get(keywords).push(itm);
}

// Identificar duplicatas (grupos com mais de 1 item)
const duplicates = Array.from(groups.entries())
  .filter(([_, items]) => items.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

console.log(`🚨 Encontrados ${duplicates.length} grupos de duplicatas:\n`);

for (const [keywords, dupes] of duplicates) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📚 GRUPO: "${keywords}" (${dupes.length} versões)`);
  console.log('='.repeat(80));

  dupes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  for (let i = 0; i < dupes.length; i++) {
    const d = dupes[i];
    const isNewest = i === 0;
    const badge = isNewest ? '✅ MAIS RECENTE' : '⚠️  ANTIGA';

    console.log(`\n${badge} [${i + 1}/${dupes.length}]`);
    console.log(`   Slug:       ${d.slug}`);
    console.log(`   Título:     ${d.title}`);
    console.log(`   Autor:      ${d.author}`);
    console.log(`   Criado em:  ${new Date(d.createdAt).toLocaleString('pt-BR')}`);
    console.log(`   Áudio:      ${d.hasAudio ? 'SIM' : 'NÃO'}`);
    console.log(`   PDF:        ${d.hasPdf ? 'SIM' : 'NÃO'}`);

    if (d.audioMinutes) {
      console.log(`   Duração:    ${Math.floor(d.audioMinutes)} min`);
    }

    if (!isNewest) {
      console.log(`   🗑️  REMOVER: node scripts/remove-item.mjs ${d.slug}`);
    }
  }
}

// Casos especiais - mesmos autores e títulos muito similares
console.log('\n\n' + '='.repeat(80));
console.log('🔬 ANÁLISE ESPECIAL - POSSÍVEIS DUPLICATAS POR AUTOR:');
console.log('='.repeat(80));

const byAuthor = new Map();
for (const itm of items) {
  const author = itm.author?.toLowerCase().trim() || 'desconhecido';
  if (!byAuthor.has(author)) {
    byAuthor.set(author, []);
  }
  byAuthor.get(author).push(itm);
}

const authorDupes = Array.from(byAuthor.entries())
  .filter(([author, items]) => items.length > 1 && author !== 'desconhecido' && author !== 'various')
  .sort((a, b) => b[1].length - a[1].length);

for (const [author, books] of authorDupes.slice(0, 10)) {
  console.log(`\n👤 ${author} (${books.length} livros):`);
  books.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  for (const b of books) {
    const age = Math.floor((Date.now() - new Date(b.createdAt)) / (1000 * 60 * 60 * 24));
    console.log(`   • ${b.title.substring(0, 60)}... (${age}d atrás) - ${b.slug}`);
  }
}

// Resumo final
console.log('\n\n' + '='.repeat(80));
console.log('📋 RESUMO DA ANÁLISE:');
console.log('='.repeat(80));
console.log(`Total de itens:           ${items.length}`);
console.log(`Grupos duplicados:        ${duplicates.length}`);
console.log(`Itens duplicados:         ${duplicates.reduce((sum, [_, dupes]) => sum + dupes.length - 1, 0)}`);
console.log(`Itens únicos (estimado):  ${items.length - duplicates.reduce((sum, [_, dupes]) => sum + dupes.length - 1, 0)}`);

await sql.end();
process.exit(0);
