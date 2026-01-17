export default {
  schema: "./shared/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "./sqlite.db",
  }
};