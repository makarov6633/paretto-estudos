#!/usr/bin/env node

import 'dotenv/config';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const POSTGRES_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL não encontrada no .env');
  process.exit(1);
}

console.log('🔄 Conectando ao banco Neon PostgreSQL...');

const sql = postgres(POSTGRES_URL, {
  ssl: 'require',
  max: 1,
});

async function runMigration() {
  try {
    console.log('📋 Lendo migration 0008_fix_reading_progress_columns.sql...');
    
    const migrationPath = join(__dirname, '..', 'drizzle', '0008_fix_reading_progress_columns.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('⚙️  Executando migration...');
    
    await sql.unsafe(migrationSQL);
    
    console.log('✅ Migration executada com sucesso!');
    console.log('');
    console.log('🔍 Verificando colunas da tabela reading_progress...');
    
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'reading_progress' 
      ORDER BY ordinal_position
    `;
    
    console.log('');
    console.log('📊 Colunas atuais:');
    columns.forEach(col => {
      console.log(`   ✓ ${col.column_name} (${col.data_type})`);
    });
    
    await sql.end();
    
    console.log('');
    console.log('🎉 Migração concluída com sucesso!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error.message);
    await sql.end();
    process.exit(1);
  }
}

runMigration();
