import "dotenv/config";
import postgres from "postgres";

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("POSTGRES_URL not set");
  process.exit(1);
}
const sql = postgres(url, { max: 1 });

const items = await sql`
  select slug, title, author, "createdAt", "hasAudio", "hasPdf", "audioMinutes", "readingMinutes"
  from "item"
  order by "createdAt" desc
`;

console.log('📊 Total de itens:', items.length);
console.log('\n🔍 ANÁLISE DETALHADA DE DUPLICATAS SUSPEITAS:\n');

// Casos específicos para investigar
const suspects = [
  {
    name: 'Pai Rico, Pai Pobre',
    keywords: ['pai', 'rico', 'pobre'],
  },
  {
    name: 'Damásio - O Erro de Descartes',
    keywords: ['erro', 'descartes'],
  },
  {
    name: 'Damásio - A Estranha Ordem das Coisas',
    keywords: ['estranha', 'ordem', 'coisas'],
  },
  {
    name: 'Damásio - O Livro da Consciência',
    keywords: ['livro', 'consciencia', 'consciência'],
  },
  {
    name: 'Determined / Determinados (Sapolsky)',
    keywords: ['determined', 'determinados'],
  },
  {
    name: 'Behave (Sapolsky)',
    keywords: ['behave'],
  },
  {
    name: 'Gestalt-Terapia',
    keywords: ['gestalt'],
  },
  {
    name: 'Psicodiagnóstico',
    keywords: ['psicodiagnostico', 'psicodiagnóstico'],
  },
  {
    name: 'Nikola Tesla',
    keywords: ['tesla', 'nikola'],
  },
  {
    name: 'O Capital (Marx)',
    keywords: ['capital', 'marx'],
  },
];

for (const suspect of suspects) {
  const matches = items.filter(item => {
    const text = `${item.title} ${item.author} ${item.slug}`.toLowerCase();
    return suspect.keywords.some(kw => text.includes(kw.toLowerCase()));
  });

  if (matches.length > 1) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🚨 ${suspect.name.toUpperCase()} - ${matches.length} VERSÕES ENCONTRADAS`);
    console.log('='.repeat(80));

    matches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const isNewest = i === 0;
      const age = Math.floor((Date.now() - new Date(m.createdAt)) / (1000 * 60 * 60 * 24));

      console.log(`\n${isNewest ? '✅ MAIS RECENTE' : `⚠️  VERSÃO ${i + 1}`} (${age}d atrás):`);
      console.log(`   Slug:         ${m.slug}`);
      console.log(`   Título:       ${m.title}`);
      console.log(`   Autor:        ${m.author || 'N/A'}`);
      console.log(`   Criado:       ${new Date(m.createdAt).toLocaleString('pt-BR')}`);
      console.log(`   Áudio:        ${m.hasAudio ? 'SIM' : 'NÃO'}${m.audioMinutes ? ` (${Math.floor(m.audioMinutes)}min)` : ''}`);
      console.log(`   PDF:          ${m.hasPdf ? 'SIM' : 'NÃO'}${m.readingMinutes ? ` (~${m.readingMinutes}min leitura)` : ''}`);

      if (!isNewest) {
        console.log(`   \n   🗑️  COMANDO PARA REMOVER:`);
        console.log(`   node scripts/remove-item.mjs ${m.slug}`);
      }
    }
  } else if (matches.length === 1) {
    console.log(`\n✅ ${suspect.name}: ÚNICO (${matches[0].slug})`);
  }
}

// Análise adicional: itens com slugs muito similares
console.log('\n\n' + '='.repeat(80));
console.log('🔬 ANÁLISE DE SLUGS SIMILARES:');
console.log('='.repeat(80));

const slugGroups = new Map();
for (const item of items) {
  // Extrair base do slug (remover sufixos numéricos e palavras como "final", "completo", etc)
  const baseSlug = item.slug
    .replace(/-\d+$/, '')
    .replace(/-final$/, '')
    .replace(/-completo$/, '')
    .replace(/-resumo$/, '')
    .replace(/-padronizado$/, '')
    .replace(/-reorganizado$/, '')
    .replace(/-reestruturado$/, '')
    .replace(/-formatado$/, '')
    .replace(/-otimizado$/, '')
    .replace(/-corrigido$/, '')
    .replace(/-v\d+$/, '');

  if (!slugGroups.has(baseSlug)) {
    slugGroups.set(baseSlug, []);
  }
  slugGroups.get(baseSlug).push(item);
}

const similarSlugs = Array.from(slugGroups.entries())
  .filter(([_, items]) => items.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

if (similarSlugs.length > 0) {
  console.log(`\n⚠️  Encontrados ${similarSlugs.length} grupos de slugs similares:\n`);

  for (const [baseSlug, group] of similarSlugs) {
    console.log(`\n📁 Base: "${baseSlug}" (${group.length} variações):`);
    group.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    for (let i = 0; i < group.length; i++) {
      const g = group[i];
      const age = Math.floor((Date.now() - new Date(g.createdAt)) / (1000 * 60 * 60 * 24));
      const badge = i === 0 ? '✅' : '⚠️ ';
      console.log(`   ${badge} ${g.slug} (${age}d) - "${g.title.substring(0, 50)}..."`);

      if (i > 0) {
        console.log(`      💡 Remover: node scripts/remove-item.mjs ${g.slug}`);
      }
    }
  }
}

console.log('\n\n' + '='.repeat(80));
console.log('📋 RECOMENDAÇÕES FINAIS:');
console.log('='.repeat(80));

const toRemove = [];

// Lógica de priorização: manter o mais recente de cada grupo
for (const [_, group] of slugGroups.entries()) {
  if (group.length > 1) {
    group.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    // Adicionar todos exceto o mais recente para remoção
    toRemove.push(...group.slice(1));
  }
}

if (toRemove.length > 0) {
  console.log(`\n⚠️  Total de ${toRemove.length} itens duplicados para remover:\n`);

  // Gerar script batch para remoção em lote
  console.log('```bash');
  console.log('# Script para remover duplicatas (mantenha apenas os mais recentes)');
  for (const item of toRemove) {
    console.log(`node scripts/remove-item.mjs ${item.slug}`);
  }
  console.log('```');

  console.log(`\n✅ Após remoção, você terá ${items.length - toRemove.length} itens únicos.`);
} else {
  console.log('\n✅ Nenhuma duplicata óbvia detectada por slug!');
  console.log('   Revise manualmente os casos marcados acima.');
}

await sql.end();
process.exit(0);
