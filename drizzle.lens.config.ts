import type { Config } from "drizzle-kit";

export default {
  dialect: "postgresql",
  schema: "./src/lib/lens/schema.ts",
  out: "./drizzle/lens",
  dbCredentials: {
    url: process.env.LENS_POSTGRES_URL!,
  },
} satisfies Config;
