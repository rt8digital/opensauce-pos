import { defineConfig } from "drizzle-kit";
import path from "path";

const isDev = process.env.NODE_ENV !== "production";
const dbPath = isDev ? "./sqlite.db" : path.join(require('electron').app?.getPath('userData') || '.', 'sqlite.db');
export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL || "sqlite.db",
  },
});