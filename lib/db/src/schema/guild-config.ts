import { pgTable, text } from "drizzle-orm/pg-core";

export const guildConfigTable = pgTable("guild_config", {
  guildId: text("guild_id").primaryKey(),
  completionsChannelId: text("completions_channel_id"),
});

export type GuildConfig = typeof guildConfigTable.$inferSelect;
