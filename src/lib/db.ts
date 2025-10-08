import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.POSTGRES_URL as string | undefined;

let dbVar: PostgresJsDatabase<typeof schema>;
if (!connectionString) {
  // Defer the failure to call time so routes can catch and fallback gracefully
  const handler: ProxyHandler<Record<string, unknown>> = {
    get() {
      throw new Error("POSTGRES_URL environment variable is not set");
    },
    apply() {
      throw new Error("POSTGRES_URL environment variable is not set");
    },
  };
  dbVar = new Proxy({} as Record<string, unknown>, handler) as unknown as PostgresJsDatabase<typeof schema>;
} else {
  const client = postgres(connectionString);
  dbVar = drizzle(client, { schema });
}
export const db = dbVar;
