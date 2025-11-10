import postgres from 'postgres';
import { readFileSync } from 'fs';

const POSTGRES_URL = process.env.POSTGRES_URL;

console.log('🔍 Iniciando migration 0009...');

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL não encontrada');
  process.exit(1);
}

const sql = postgres(POSTGRES_URL, {
  ssl: 'require',
  max: 1,
});

async function migrate() {
  try {
    console.log('📡 Conectando...');
    await sql`SELECT 1`;
    console.log('✅ Conectado!');
    
    console.log('\n📋 Colunas ANTES:');
    const before = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'reading_progress' 
      ORDER BY ordinal_position
    `;
    before.forEach(c => console.log(`   - ${c.column_name}`));
    
    console.log('\n⚙️  Aplicando migration 0009...');
    const migrationSQL = readFileSync('drizzle/0009_align_reading_progress_schema.sql', 'utf-8');
    await sql.unsafe(migrationSQL);
    console.log('✅ Migration 0009 aplicada!');
    
    console.log('\n📊 Colunas DEPOIS:');
    const after = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'reading_progress' 
      ORDER BY ordinal_position
    `;
    after.forEach(c => console.log(`   ✓ ${c.column_name}`));
    
    await sql.end();
    console.log('\n🎉 Schema completamente alinhado!');
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    await sql.end();
    process.exit(1);
  }
}

migrate();
