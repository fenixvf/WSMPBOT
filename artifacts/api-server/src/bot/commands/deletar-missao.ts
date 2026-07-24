import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { db } from "@workspace/db";
import { missionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export const data = new SlashCommandBuilder()
  .setName("missao-deletar")
  .setDescription("Desativa uma missão existente")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addIntegerOption((opt) =>
    opt
      .setName("id")
      .setDescription("ID da missão a ser deletada")
      .setRequired(true)
      .setMinValue(1),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const id = interaction.options.getInteger("id", true);

  const [mission] = await db
    .select()
    .from(missionsTable)
    .where(and(eq(missionsTable.id, id), eq(missionsTable.isActive, true)));

  if (!mission) {
    await interaction.editReply({
      content: `❌ Nenhuma missão ativa encontrada com o ID \`${id}\`. Use \`/missoes\` para ver as missões disponíveis.`,
    });
    return;
  }

  await db
    .update(missionsTable)
    .set({ isActive: false })
    .where(eq(missionsTable.id, id));

  const embed = new EmbedBuilder()
    .setTitle("🗑️ Missão Desativada")
    .setColor(0xff4444)
    .addFields(
      { name: "📋 Título", value: mission.title },
      { name: "🆔 ID", value: String(mission.id), inline: true },
    )
    .setFooter({ text: `Removida por ${interaction.user.username}` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
