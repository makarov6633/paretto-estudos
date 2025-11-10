import postgres from 'postgres';
import { readFileSync } from 'fs';

// Ler .env manualmente
const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    envVars[key] = value;
  }
});

const POSTGRES_URL = envVars.POSTGRES_URL || envVars.DATABASE_URL;

console.log('🔍 Verificando conexão com o banco...');
console.log('URL:', POSTGRES_URL ? '✅ Configurada' : '❌ Não encontrada');

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL não encontrada no .env');
  process.exit(1);
}

const sql = postgres(POSTGRES_URL, {
  ssl: 'require',
  max: 1,
});

async function test() {
  try {
    console.log('📡 Conectando ao Neon PostgreSQL...');
    
    const result = await sql`SELECT version()`;
    console.log('✅ Conexão bem-sucedida!');
    
    console.log('\n🔍 Verificando tabela reading_progress...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'reading_progress'
    `;
    
    if (tables.length > 0) {
      console.log('✅ Tabela reading_progress existe!');
      
      const columns = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'reading_progress' 
        ORDER BY ordinal_position
      `;
      
      console.log('\n📋 Colunas atuais:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}`);
      });
      
      // Agora aplicar a migration
      console.log('\n⚙️  Aplicando migration...');
      const migrationSQL = readFileSync('drizzle/0008_fix_reading_progress_columns.sql', 'utf-8');
      
      await sql.unsafe(migrationSQL);
      
      console.log('✅ Migration aplicada!');
      
      // Verificar colunas após migration
      const newColumns = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'reading_progress' 
        ORDER BY ordinal_position
      `;
      
      console.log('\n📊 Colunas após migration:');
      newColumns.forEach(col => {
        console.log(`   ✓ ${col.column_name}`);
      });
      
    } else {
      console.log('⚠️  Tabela reading_progress NÃO existe!');
    }
    
    await sql.end();
    console.log('\n🎉 Processo concluído!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
    await sql.end();
    process.exit(1);
  }
}

test();
