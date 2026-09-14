import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const attendanceEnum = pgEnum("attendance", ["attending", "not_attending"]);
export const wishStatusEnum = pgEnum("wish_status", ["pending", "approved", "hidden"]);

export const guests = pgTable(
  "guests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    phone: varchar("phone", { length: 24 }).notNull(),
    invitationToken: varchar("invitation_token", { length: 64 }).notNull(),
    maxGuests: integer("max_guests").default(1).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("guests_phone_unique").on(table.phone),
    uniqueIndex("guests_invitation_token_unique").on(table.invitationToken),
    check("guests_max_guests_check", sql`${table.maxGuests} between 1 and 10`),
  ],
);

export const rsvps = pgTable(
  "rsvps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    guestId: uuid("guest_id").notNull().references(() => guests.id, { onDelete: "cascade" }),
    attendance: attendanceEnum("attendance").notNull(),
    guestCount: integer("guest_count").default(1).notNull(),
    message: text("message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("rsvps_guest_unique").on(table.guestId),
    check("rsvps_guest_count_check", sql`${table.guestCount} between 0 and 10`),
  ],
);

export const wishes = pgTable(
  "wishes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    guestId: uuid("guest_id").notNull().references(() => guests.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    status: wishStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("wishes_status_created_index").on(table.status, table.createdAt)],
);

export const rateLimits = pgTable("rate_limits", {
  key: varchar("key", { length: 96 }).primaryKey(),
  attempts: integer("attempts").default(1).notNull(),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Guest = typeof guests.$inferSelect;
export type NewGuest = typeof guests.$inferInsert;
export type Rsvp = typeof rsvps.$inferSelect;
export type Wish = typeof wishes.$inferSelect;
export type SiteSetting = typeof siteSettings.$inferSelect;
