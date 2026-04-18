import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.LENS_POSTGRES_URL;

if (!connectionString) {
  throw new Error("LENS_POSTGRES_URL environment variable is not set");
}

const client = postgres(connectionString);
export const lensDb = drizzle(client, { schema });
