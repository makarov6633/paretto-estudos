import "dotenv/config";
import postgres from "postgres";
import fs from "fs";
import path from "path";

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("POSTGRES_URL not set");
  process.exit(1);
}
const sql = postgres(url, { max: 1 });

const items = await sql`
  select slug, title, author, "createdAt", "hasAudio", "hasPdf", "audioMinutes", "readingMinutes", "pdfUrl"
  from "item"
  order by "createdAt" desc
`;

console.log('📊 Total de itens no banco:', items.length);
console.log('\n' + '='.repeat(80));
console.log('🔍 ANÁLISE FINAL DE DUPLICATAS - VERIFICAÇÃO MANUAL');
console.log('='.repeat(80) + '\n');

// Casos conhecidos de livros que podem ter múltiplas versões
const duplicateChecks = [
  {
    name: 'Pai Rico, Pai Pobre (Robert Kiyosaki)',
    slugs: ['pai-rico-pai-pobre', 'pai-rico', 'pobre'],
  },
  {
    name: 'O Erro de Descartes (António Damásio)',
    slugs: ['erro-de-descartes', 'e-o-cerebro-criou-o-homem'],
  },
  {
    name: 'Behave (Robert Sapolsky)',
    slugs: ['behave'],
  },
  {
    name: 'Determined / Determinados (Sapolsky)',
    slugs: ['determined', 'determinados'],
  },
  {
    name: 'O Capital (Karl Marx)',
    slugs: ['capital'],
  },
  {
    name: 'Gestalt-Terapia',
    slugs: ['gestalt'],
  },
  {
    name: 'Psicodiagnóstico',
    slugs: ['psicodiagnostico'],
  },
  {
    name: 'Teorias da Personalidade',
    slugs: ['teorias', 'personalidade'],
  },
  {
    name: 'Hábitos Atômicos',
    slugs: ['habitos', 'atomicos'],
  },
];

const foundDuplicates = [];

for (const check of duplicateChecks) {
  const matches = items.filter(item =>
    check.slugs.some(slug => item.slug.toLowerCase().includes(slug.toLowerCase()))
  );

  if (matches.length > 1) {
    console.log(`🚨 ${check.name.toUpperCase()}`);
    console.log('─'.repeat(80));

    matches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Verificar tamanho dos arquivos para determinar qual é mais completo
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const isNewest = i === 0;

      let pdfSize = 'N/A';
      let audioSize = 'N/A';

      if (m.pdfUrl) {
        const pdfPath = path.join(process.cwd(), 'public', m.pdfUrl);
        if (fs.existsSync(pdfPath)) {
          const stats = fs.statSync(pdfPath);
          pdfSize = `${(stats.size / 1024).toFixed(0)} KB`;
        }
      }

      if (m.hasAudio) {
        const audioPath = path.join(process.cwd(), 'public', 'media', 'audio', `${m.slug}.wav`);
        if (fs.existsSync(audioPath)) {
          const stats = fs.statSync(audioPath);
          audioSize = `${(stats.size / 1024 / 1024).toFixed(1)} MB`;
        }
      }

      console.log(`\n${isNewest ? '✅ MAIS RECENTE' : `⚠️  VERSÃO ${i + 1}`}:`);
      console.log(`   Slug:          ${m.slug}`);
      console.log(`   Título:        ${m.title}`);
      console.log(`   Autor:         ${m.author || 'N/A'}`);
      console.log(`   Criado:        ${new Date(m.createdAt).toLocaleString('pt-BR')}`);
      console.log(`   PDF:           ${pdfSize}${m.readingMinutes ? ` (~${m.readingMinutes}min)` : ''}`);
      console.log(`   Áudio:         ${m.hasAudio ? audioSize : 'NÃO'}${m.audioMinutes ? ` (${Math.floor(m.audioMinutes)}min)` : ''}`);

      if (i > 0) {
        console.log(`\n   ❓ COMPARAR MANUALMENTE antes de remover!`);
        console.log(`   🗑️  Se confirmar duplicata: node scripts/remove-item.mjs ${m.slug}`);
        foundDuplicates.push({ group: check.name, slug: m.slug, index: i });
      }
    }

    console.log('\n');
  } else if (matches.length === 1) {
    console.log(`✅ ${check.name}: ÚNICO (${matches[0].slug})`);
  } else {
    console.log(`ℹ️  ${check.name}: NÃO ENCONTRADO`);
  }
}

// Verificar por autor (casos onde há vários livros do mesmo autor)
console.log('\n' + '='.repeat(80));
console.log('📚 LIVROS POR AUTOR (possíveis duplicatas):');
console.log('='.repeat(80) + '\n');

const byAuthor = new Map();
for (const item of items) {
  const author = (item.author || 'Desconhecido')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (!byAuthor.has(author)) {
    byAuthor.set(author, []);
  }
  byAuthor.get(author).push(item);
}

const multiBookAuthors = Array.from(byAuthor.entries())
  .filter(([author, books]) => books.length > 1 && author !== 'desconhecido' && author !== 'various')
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 10);

for (const [author, books] of multiBookAuthors) {
  console.log(`\n👤 ${author} (${books.length} livros):`);
  books.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  for (const b of books) {
    const age = Math.floor((Date.now() - new Date(b.createdAt)) / (1000 * 60 * 60 * 24));
    console.log(`   • ${b.slug}`);
    console.log(`     "${b.title}" (${age}d atrás)`);
  }
}

// Resumo final
console.log('\n\n' + '='.repeat(80));
console.log('📋 RESUMO E RECOMENDAÇÕES:');
console.log('='.repeat(80) + '\n');

console.log(`Total de itens:                    ${items.length}`);
console.log(`Grupos com possíveis duplicatas:   ${foundDuplicates.length > 0 ? Math.ceil(foundDuplicates.length / 2) : 0}`);
console.log(`Itens marcados para revisão:       ${foundDuplicates.length}`);

if (foundDuplicates.length > 0) {
  console.log('\n⚠️  AÇÃO NECESSÁRIA:');
  console.log('   1. Revise manualmente cada grupo marcado acima');
  console.log('   2. Compare o conteúdo dos PDFs para confirmar se são realmente duplicatas');
  console.log('   3. Mantenha SEMPRE a versão mais completa e/ou recente');
  console.log('   4. Use os comandos fornecidos para remover as versões antigas\n');

  console.log('   💡 DICA: Priorize manter:');
  console.log('      - Versões com CORRIGIDO, FINAL, v2+, etc no nome');
  console.log('      - Arquivos maiores (geralmente mais completos)');
  console.log('      - Versões mais recentes (se conteúdo similar)\n');
} else {
  console.log('\n✅ Nenhuma duplicata óbvia detectada!');
  console.log('   Os itens parecem únicos baseado na análise automática.');
  console.log('   Revise os autores com múltiplos livros para garantir.\n');
}

await sql.end();
process.exit(0);
