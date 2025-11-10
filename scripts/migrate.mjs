import postgres from 'postgres';
import { readFileSync } from 'fs';

const POSTGRES_URL = process.env.POSTGRES_URL;

console.log('🔍 Iniciando processo de migration...');

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL não encontrada nas variáveis de ambiente');
  console.error('Use: POSTGRES_URL=... node scripts/migrate.mjs');
  process.exit(1);
}

console.log('✅ URL do banco configurada');

const sql = postgres(POSTGRES_URL, {
  ssl: 'require',
  max: 1,
});

async function migrate() {
  try {
    console.log('📡 Conectando ao Neon PostgreSQL...');
    
    await sql`SELECT 1`;
    console.log('✅ Conexão estabelecida!');
    
    console.log('\n🔍 Verificando colunas da tabela reading_progress...');
    const currentColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'reading_progress' 
      ORDER BY ordinal_position
    `;
    
    console.log('📋 Colunas ANTES da migration:');
    currentColumns.forEach(col => {
      console.log(`   - ${col.column_name}`);
    });
    
    console.log('\n⚙️  Aplicando migration 0008...');
    const migrationSQL = readFileSync('drizzle/0008_fix_reading_progress_columns.sql', 'utf-8');
    
    await sql.unsafe(migrationSQL);
    
    console.log('✅ Migration aplicada com sucesso!');
    
    console.log('\n🔍 Verificando colunas após migration...');
    const newColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'reading_progress' 
      ORDER BY ordinal_position
    `;
    
    console.log('📊 Colunas DEPOIS da migration:');
    newColumns.forEach(col => {
      console.log(`   ✓ ${col.column_name}`);
    });
    
    await sql.end();
    console.log('\n🎉 Migration concluída com sucesso!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Erro ao executar migration:');
    console.error(error.message);
    if (error.detail) console.error('Detalhe:', error.detail);
    await sql.end();
    process.exit(1);
  }
}

migrate();
