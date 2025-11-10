import 'dotenv/config';
import postgres from 'postgres';

const POSTGRES_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;

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
    console.log('PostgreSQL version:', result[0].version.split(' ')[0], result[0].version.split(' ')[1]);
    
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
    } else {
      console.log('⚠️  Tabela reading_progress NÃO existe!');
    }
    
    await sql.end();
    console.log('\n✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await sql.end();
    process.exit(1);
  }
}

test();
