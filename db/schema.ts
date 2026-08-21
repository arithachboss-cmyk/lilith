import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  source: text("source").notNull(),
  budget: integer("budget").notNull(),
  area: text("area").notNull(),
  moveDate: text("move_date"),
  stage: text("stage").notNull(),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});
