import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Golfare
export const golfare = sqliteTable("golfare", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  namn: text("namn").notNull(),
  klubb: text("klubb"),
  standardHandicap: real("standard_handicap").notNull().default(36),
  hickoryHandicap: real("hickory_handicap").notNull().default(50),
  aktiv: integer("aktiv", { mode: "boolean" }).notNull().default(true),
  stamspelare: integer("stamspelare", { mode: "boolean" }).notNull().default(false),
});

export const insertGolfareSchema = createInsertSchema(golfare).omit({ id: true });
export type InsertGolfare = z.infer<typeof insertGolfareSchema>;
export type Golfare = typeof golfare.$inferSelect;

// Banor
export const banor = sqliteTable("banor", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  namn: text("namn").notNull(),
  ort: text("ort"),
  par: integer("par").notNull().default(72),
  slope: integer("slope").notNull().default(113),
  parPerHal: text("par_per_hal"), // JSON array [4,4,3,...] för 18 hål
  kursrating: real("kursrating").notNull().default(72.0),
  langd: integer("langd"),
});

export const insertBanaSchema = createInsertSchema(banor).omit({ id: true });
export type InsertBana = z.infer<typeof insertBanaSchema>;
export type Bana = typeof banor.$inferSelect;

// Rundor
export const rundor = sqliteTable("rundor", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  golfareId: integer("golfare_id").notNull().references(() => golfare.id),
  banaId: integer("bana_id").notNull().references(() => banor.id),
  datum: text("datum").notNull(),
  bruttoscore: integer("bruttoscore").notNull(),
  nettoscore: real("nettoscore"),
  hickoryHandicapVid: real("hickory_handicap_vid").notNull(),
  halForHal: text("hal_for_hal"), // JSON array med slag per hål
  arTavling: integer("ar_tavling", { mode: "boolean" }).notNull().default(false),
  tavlingId: integer("tavling_id"),
  noteringar: text("noteringar"),
});

export const insertRundaSchema = createInsertSchema(rundor).omit({ id: true });
export type InsertRunda = z.infer<typeof insertRundaSchema>;
export type Runda = typeof rundor.$inferSelect;

// Tävlingar
export const tavlingar = sqliteTable("tavlingar", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  namn: text("namn").notNull(),
  banaId: integer("bana_id").references(() => banor.id),
  datum: text("datum").notNull(),
  beskrivning: text("beskrivning"),
  arOrderOfMerit: integer("ar_order_of_merit", { mode: "boolean" }).notNull().default(false),
  avslutad: integer("avslutad", { mode: "boolean" }).notNull().default(false),
  parOverride: text("par_override"), // JSON array — override banans par om satt
  anmalningsLank: text("anmalnings_lank"), // Extern länk till tävling (t.ex Min Golf)
});

export const insertTavlingSchema = createInsertSchema(tavlingar).omit({ id: true });
export type InsertTavling = z.infer<typeof insertTavlingSchema>;
export type Tavling = typeof tavlingar.$inferSelect;

// Tävlingsresultat
export const tavlingsresultat = sqliteTable("tavlingsresultat", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tavlingId: integer("tavling_id").notNull().references(() => tavlingar.id),
  golfareId: integer("golfare_id").notNull().references(() => golfare.id),
  bruttoscore: integer("bruttoscore").notNull(),
  nettoscore: real("nettoscore"),
  hickoryHandicapVid: real("hickory_handicap_vid").notNull(),
  placering: integer("placering"),
  orderOfMeritPoang: integer("order_of_merit_poang"),
  bruttoPlacering: integer("brutto_placering"),
  bruttoOmPoang: integer("brutto_om_poang"),
});

export const insertTavlingsresultatSchema = createInsertSchema(tavlingsresultat).omit({ id: true });
export type InsertTavlingsresultat = z.infer<typeof insertTavlingsresultatSchema>;
export type Tavlingsresultat = typeof tavlingsresultat.$inferSelect;

// Reportage
export const reportage = sqliteTable("reportage", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rubrik: text("rubrik").notNull(),
  datum: text("datum").notNull(),
  ingress: text("ingress"),
  innehall: text("innehall").notNull(),
  bildUrl: text("bild_url"),
  tavlingId: integer("tavling_id"),
  publicerad: integer("publicerad", { mode: "boolean" }).notNull().default(true),
});

export const insertReportageSchema = createInsertSchema(reportage).omit({ id: true });
export type InsertReportage = z.infer<typeof insertReportageSchema>;
export type Reportage = typeof reportage.$inferSelect;
