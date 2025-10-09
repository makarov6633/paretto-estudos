import "dotenv/config";
import postgres from "postgres";

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const sql = postgres(url, {max:1});
const items = await sql`select count(*) from item`;
console.log('Total de itens no banco:', items[0].count);
await sql.end();
