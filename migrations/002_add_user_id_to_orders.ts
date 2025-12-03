import { sql } from "drizzle-orm";

export async function up(db: any) {
    await db.execute(sql`
    ALTER TABLE orders
    ADD COLUMN user_id INTEGER REFERENCES users(id);
  `);
}

export async function down(db: any) {
    await db.execute(sql`
    ALTER TABLE orders
    DROP COLUMN user_id;
  `);
}
