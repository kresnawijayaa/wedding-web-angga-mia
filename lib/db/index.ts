import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let database: ReturnType<typeof createDatabase> | undefined;

function createDatabase() {
  const connectionUrl = process.env.DATABASE_URL;

  if (!connectionUrl) {
    throw new Error("DATABASE_URL is not configured. Copy .env.example to .env.local and add the Neon pooled connection string.");
  }

  return drizzle(neon(connectionUrl), { schema });
}

export function getDb() {
  database ??= createDatabase();
  return database;
}
