import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  contact: text("contact"),
  source: text("source").notNull(),
  budget: integer("budget").notNull(),
  area: text("area").notNull(),
  propertyType: text("property_type"),
  bedrooms: integer("bedrooms"),
  moveDate: text("move_date"),
  viewingWindow: text("viewing_window"),
  contractTerm: text("contract_term"),
  preferredLanguage: text("preferred_language"),
  pets: text("pets"),
  requirements: text("requirements"),
  consentAt: text("consent_at"),
  spamSignal: text("spam_signal"),
  stage: text("stage").notNull(),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});
