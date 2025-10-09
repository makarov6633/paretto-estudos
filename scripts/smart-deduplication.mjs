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

// Buscar todos os itens do banco
const items = await sql`
  select slug, title, author, "createdAt", "pdfUrl"
  from "item"
  order by slug
`;

console.log('📊 Total de itens no banco:', items.length);
console.log('\n' + '='.repeat(80));
console.log('🔍 ANÁLISE INTELIGENTE DE DUPLICATAS POR DATA DE ARQUIVO');
console.log('='.repeat(80) + '\n');

const sourceFolder = path.join(process.cwd(), 'resumos e audio');
const publicFolder = path.join(process.cwd(), 'public');

// Grupos de duplicatas conhecidos (baseado em análise do conteúdo)
const duplicateGroups = [
  {
    name: 'Pai Rico, Pai Pobre',
    slugs: [
      'pai-rico-pai-pobre-resumo-completo-30-paginas',
      'pai-rico-pai-pobre-resumo-completo',
    ],
    sourceFiles: [
      'Pai-Rico-Pai-Pobre-Resumo-Completo-30-Paginas.pdf',
      'Pai-Rico-Pai-Pobre-Resumo-Completo.pdf',
    ]
  },
  {
    name: 'Determined / Determinados (Sapolsky)',
    slugs: [
      'resumo-determinados-corrigido',
      'resumo-determined-final-v6',
      'determined-resumo-completo-final',
    ],
    sourceFiles: [
      'Resumo_Determinados_CORRIGIDO.pdf',
      'Resumo_Determined_FINAL_v6.pdf',
      'determined_resumo_completo_final.pdf',
    ]
  },
  {
    name: 'Behave (Sapolsky)',
    slugs: [
      'behave',
      'behave-corrigido',
    ],
    sourceFiles: [
      'Resumo_Completo_Behave.pdf',
      'Resumo_Completo_Behave_CORRIGIDO.pdf',
    ]
  },
  {
    name: 'O Capital (Marx)',
    slugs: [
      'o-capital-volume-i-profissional',
      'resumo-o-capital-completo-final',
      'o-capital-volume-i',
    ],
    sourceFiles: [
      'Resumo_Completo_O_Capital_Volume_I_Profissional.pdf',
      'Resumo_O_Capital_Completo_Final.pdf',
      'Resumo_Completo_O_Capital_Volume_I.pdf',
    ]
  },
  {
    name: 'O Erro de Descartes (Damásio)',
    slugs: [
      'e-o-cerebro-criou-o-homem-reorganizado',
      'o-erro-de-descartes',
    ],
    sourceFiles: [
      'E_o_Cerebro_Criou_o_Homem_Reorganizado.pdf',
      'novos resumos_Resumo_Completo_O_Erro_de_Descartes.pdf',
    ]
  },
];

const toRemove = [];

for (const group of duplicateGroups) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📚 ${group.name.toUpperCase()}`);
  console.log('='.repeat(80));

  // Encontrar itens deste grupo no banco
  const groupItems = items.filter(item => group.slugs.includes(item.slug));

  if (groupItems.length === 0) {
    console.log('⚠️  Nenhum item deste grupo encontrado no banco\n');
    continue;
  }

  // Obter informações de data dos arquivos fonte
  const fileInfos = [];
  for (let i = 0; i < group.sourceFiles.length; i++) {
    const sourceFile = group.sourceFiles[i];
    const sourcePath = path.join(sourceFolder, sourceFile);

    if (fs.existsSync(sourcePath)) {
      const stats = fs.statSync(sourcePath);
      fileInfos.push({
        sourceFile,
        slug: group.slugs[i],
        mtime: stats.mtime,
        mtimeMs: stats.mtimeMs,
        size: stats.size,
      });
    } else {
      console.log(`⚠️  Arquivo fonte não encontrado: ${sourceFile}`);
    }
  }

  // Ordenar por data (mais recente primeiro)
  fileInfos.sort((a, b) => b.mtimeMs - a.mtimeMs);

  console.log(`\nEncontrados ${groupItems.length} itens no banco, ${fileInfos.length} arquivos fonte:\n`);

  for (let i = 0; i < fileInfos.length; i++) {
    const info = fileInfos[i];
    const isNewest = i === 0;
    const inDb = groupItems.find(item => item.slug === info.slug);

    const age = Math.floor((Date.now() - info.mtimeMs) / (1000 * 60 * 60 * 24));
    const sizeMB = (info.size / 1024 / 1024).toFixed(2);

    console.log(`${isNewest ? '✅ MAIS RECENTE' : `⚠️  VERSÃO ${i + 1}`} (${age}d atrás):`);
    console.log(`   Arquivo:  ${info.sourceFile}`);
    console.log(`   Data:     ${info.mtime.toLocaleString('pt-BR')}`);
    console.log(`   Tamanho:  ${sizeMB} MB`);
    console.log(`   Slug:     ${info.slug}`);
    console.log(`   No banco: ${inDb ? '✓ SIM' : '✗ NÃO'}`);

    if (!isNewest && inDb) {
      console.log(`   \n   🗑️  MARCAR PARA REMOÇÃO`);
      toRemove.push({ slug: info.slug, group: group.name, reason: 'Versão mais antiga' });
    } else if (isNewest && !inDb) {
      console.log(`   \n   ⚠️  MAIS RECENTE NÃO ESTÁ NO BANCO! Precisa reimportar.`);
    }

    console.log('');
  }
}

// Verificar Damásio - múltiplos livros
console.log('\n' + '='.repeat(80));
console.log('📚 ANTÓNIO DAMÁSIO - MÚLTIPLOS LIVROS (NÃO SÃO DUPLICATAS)');
console.log('='.repeat(80) + '\n');

const damasioBooks = items.filter(item =>
  item.author && item.author.toLowerCase().includes('damas')
);

console.log(`Encontrados ${damasioBooks.length} livros de Damásio:\n`);
for (const book of damasioBooks) {
  console.log(`✅ ${book.slug}`);
  console.log(`   Título: ${book.title}`);
  console.log(`   Autor:  ${book.author}\n`);
}

// Resumo e ações
console.log('\n' + '='.repeat(80));
console.log('📋 AÇÕES RECOMENDADAS:');
console.log('='.repeat(80) + '\n');

if (toRemove.length > 0) {
  console.log(`🗑️  ${toRemove.length} ITENS DUPLICADOS PARA REMOVER:\n`);

  // Agrupar por grupo
  const byGroup = new Map();
  for (const item of toRemove) {
    if (!byGroup.has(item.group)) {
      byGroup.set(item.group, []);
    }
    byGroup.get(item.group).push(item);
  }

  for (const [groupName, items] of byGroup.entries()) {
    console.log(`\n${groupName}:`);
    for (const item of items) {
      console.log(`   node scripts/remove-item.mjs ${item.slug}`);
    }
  }

  console.log('\n\n📝 SCRIPT DE REMOÇÃO EM LOTE:\n');
  console.log('```bash');
  for (const item of toRemove) {
    console.log(`node scripts/remove-item.mjs ${item.slug}`);
  }
  console.log('```');

  console.log(`\n\n✅ Após remoção: ${items.length} → ${items.length - toRemove.length} itens únicos`);
} else {
  console.log('✅ Nenhuma duplicata clara detectada para remoção automática.');
  console.log('   Todos os itens parecem únicos ou requerem verificação manual.');
}

await sql.end();
process.exit(0);
