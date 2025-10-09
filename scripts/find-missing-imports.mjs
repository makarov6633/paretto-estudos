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

// Buscar itens do banco
const items = await sql`
  select slug, title, author, "pdfUrl", "createdAt"
  from "item"
  order by slug
`;

console.log(`📊 Itens no banco: ${items.length}`);

// Listar PDFs na pasta
const folder = path.join(process.cwd(), 'resumos e audio');
const files = fs.readdirSync(folder);
const pdfs = files.filter(f => f.toLowerCase().endsWith('.pdf'));

console.log(`📁 PDFs na pasta: ${pdfs.length}\n`);

// Criar mapa de PDFs por nome base (sem extensão)
const pdfMap = new Map();
for (const pdf of pdfs) {
  const base = pdf.replace(/\.pdf$/i, '');
  pdfMap.set(base.toLowerCase(), pdf);
}

// Verificar quais PDFs não estão no banco
const slugsInDb = new Set(items.map(i => {
  // Extrair nome do arquivo do pdfUrl
  if (i.pdfUrl) {
    const match = i.pdfUrl.match(/\/media\/pdf\/(.+)\.pdf$/);
    return match ? match[1].toLowerCase() : null;
  }
  return null;
}).filter(Boolean));

const missingInDb = [];
for (const [baseNameLower, pdfFile] of pdfMap.entries()) {
  if (!slugsInDb.has(baseNameLower)) {
    missingInDb.push(pdfFile);
  }
}

if (missingInDb.length > 0) {
  console.log(`⚠️  ${missingInDb.length} PDFs NÃO IMPORTADOS:\n`);
  for (const pdf of missingInDb.sort()) {
    console.log(`   📄 ${pdf}`);
  }
} else {
  console.log('✅ Todos os PDFs foram importados!');
}

// Verificar se há itens no banco sem arquivo correspondente
console.log('\n' + '='.repeat(80));
console.log('🔍 Verificando itens no banco sem arquivo correspondente:');
console.log('='.repeat(80) + '\n');

const orphanedItems = [];
for (const item of items) {
  if (item.pdfUrl) {
    const match = item.pdfUrl.match(/\/media\/pdf\/(.+)\.pdf$/);
    if (match) {
      const slug = match[1];
      const exists = fs.existsSync(path.join(process.cwd(), 'public', item.pdfUrl));

      if (!exists) {
        orphanedItems.push(item);
      }
    }
  }
}

if (orphanedItems.length > 0) {
  console.log(`⚠️  ${orphanedItems.length} itens no banco SEM arquivo PDF correspondente:\n`);
  for (const item of orphanedItems) {
    console.log(`   🗑️  ${item.slug} - "${item.title}"`);
    console.log(`       PDF esperado: ${item.pdfUrl}`);
    console.log(`       Remover: node scripts/remove-item.mjs ${item.slug}\n`);
  }
} else {
  console.log('✅ Todos os itens têm arquivos correspondentes!');
}

// Análise de duplicatas por nome de arquivo
console.log('\n' + '='.repeat(80));
console.log('🔬 ANÁLISE DE DUPLICATAS POR NOME DE ARQUIVO:');
console.log('='.repeat(80) + '\n');

const fileGroups = new Map();

for (const pdf of pdfs) {
  // Normalizar nome removendo sufixos comuns
  let normalized = pdf
    .toLowerCase()
    .replace(/\.pdf$/i, '')
    .replace(/resumo[_-]completo[_-]?/gi, '')
    .replace(/resumo[_-]?/gi, '')
    .replace(/[_-]completo[_-]?/gi, '')
    .replace(/[_-]final[_-]?/gi, '')
    .replace(/[_-]padronizado[_-]?/gi, '')
    .replace(/[_-]reorganizado[_-]?/gi, '')
    .replace(/[_-]reestruturado[_-]?/gi, '')
    .replace(/[_-]formatado[_-]?/gi, '')
    .replace(/[_-]otimizado[_-]?/gi, '')
    .replace(/[_-]corrigido[_-]?/gi, '')
    .replace(/[_-]dissertativo[_-]?/gi, '')
    .replace(/[_-]expandido[_-]?/gi, '')
    .replace(/[_-]profissional[_-]?/gi, '')
    .replace(/[_-]v\d+[_-]?/gi, '')
    .replace(/[_-]\d+[_-]?paginas[_-]?/gi, '')
    .replace(/[_-]\d+[_-]?por[_-]?cento[_-]?/gi, '')
    .replace(/novos[_-]resumos[_-]/gi, '')
    .replace(/[_-]+/g, '-')
    .replace(/^-|-$/g, '');

  if (!fileGroups.has(normalized)) {
    fileGroups.set(normalized, []);
  }
  fileGroups.get(normalized).push(pdf);
}

const duplicateGroups = Array.from(fileGroups.entries())
  .filter(([_, files]) => files.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

if (duplicateGroups.length > 0) {
  console.log(`🚨 ${duplicateGroups.length} GRUPOS DE ARQUIVOS DUPLICADOS:\n`);

  for (const [baseName, dupes] of duplicateGroups) {
    console.log(`\n📚 "${baseName}" (${dupes.length} versões):`);

    // Ordenar por data de modificação (mais recente primeiro)
    const dupesWithStats = dupes.map(f => ({
      name: f,
      stats: fs.statSync(path.join(folder, f)),
    })).sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs);

    for (let i = 0; i < dupesWithStats.length; i++) {
      const d = dupesWithStats[i];
      const isNewest = i === 0;
      const age = Math.floor((Date.now() - d.stats.mtimeMs) / (1000 * 60 * 60 * 24));
      const sizeMB = (d.stats.size / 1024 / 1024).toFixed(2);

      console.log(`   ${isNewest ? '✅' : '⚠️ '} ${d.name}`);
      console.log(`      Modificado: ${d.stats.mtime.toLocaleString('pt-BR')} (${age}d atrás)`);
      console.log(`      Tamanho: ${sizeMB} MB`);

      // Verificar se está no banco
      const baseNameLower = d.name.replace(/\.pdf$/i, '').toLowerCase();
      const inDb = slugsInDb.has(baseNameLower);
      console.log(`      No banco: ${inDb ? 'SIM ✓' : 'NÃO ✗'}`);
    }
  }
} else {
  console.log('✅ Nenhum grupo de arquivos duplicados detectado!');
}

console.log('\n' + '='.repeat(80));
console.log('📋 RESUMO:');
console.log('='.repeat(80));
console.log(`PDFs na pasta:                ${pdfs.length}`);
console.log(`Itens no banco:               ${items.length}`);
console.log(`PDFs não importados:          ${missingInDb.length}`);
console.log(`Itens órfãos (sem arquivo):   ${orphanedItems.length}`);
console.log(`Grupos de duplicatas:         ${duplicateGroups.length}`);

await sql.end();
process.exit(0);
