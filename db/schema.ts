import { sql } from "drizzle-orm";
import { index, real, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  contact: text("contact"),
  source: text("source").notNull(),
  budget: integer("budget").notNull(),
  budgetPeriod: text("budget_period"),
  area: text("area").notNull(),
  propertyType: text("property_type"),
  bedrooms: integer("bedrooms"),
  moveDate: text("move_date"),
  viewingWindow: text("viewing_window"),
  contractTerm: text("contract_term"),
  preferredLanguage: text("preferred_language"),
  customerCountry: text("customer_country"),
  dealIntent: text("deal_intent"),
  wechat: text("wechat"),
  partnerAgency: text("partner_agency"),
  partnerAgent: text("partner_agent"),
  partnerContact: text("partner_contact"),
  externalId: text("external_id"),
  importBatch: text("import_batch"),
  pets: text("pets"),
  requirements: text("requirements"),
  consentAt: text("consent_at"),
  spamSignal: text("spam_signal"),
  stage: text("stage").notNull(),
  nextFollowUpAt: text("next_follow_up_at"),
  updatedAt: text("updated_at"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const agentMembers = sqliteTable('agent_members', {
 id:text('id').primaryKey(),email:text('email').notNull().unique(),team:text('team').notNull(),tier:integer('tier').notNull(),score:integer('score').notNull().default(0),note:text('note').notNull().default(''),
});
export const agentProperties = sqliteTable('agent_properties', {
 id:text('id').primaryKey(),name:text('name').notNull(),area:text('area').notNull(),rent:integer('rent').notNull(),bedrooms:integer('bedrooms').notNull(),size:real('size').notNull(),tier:integer('tier').notNull(),status:text('status').notNull(),owner:text('owner').notNull(),photos:text('photos').notNull(),updatedAt:text('updated_at').notNull(),
}, table => [index('agent_properties_tier').on(table.tier)]);
export const agentPhotos = sqliteTable('agent_photos',{id:text('id').primaryKey(),owner:text('owner').notNull()});
export const agentReviews = sqliteTable('agent_reviews',{id:integer('id').primaryKey({autoIncrement:true}),agentId:text('agent_id').notNull(),reviewer:text('reviewer').notNull(),score:integer('score').notNull(),tier:integer('tier').notNull(),note:text('note').notNull(),createdAt:text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`)});
