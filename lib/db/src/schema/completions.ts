import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { missionsTable } from "./missions";

export const completionsTable = pgTable("completions", {
  id: serial("id").primaryKey(),
  missionId: integer("mission_id")
    .notNull()
    .references(() => missionsTable.id),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  imageUrl: text("image_url").notNull(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export type Completion = typeof completionsTable.$inferSelect;
