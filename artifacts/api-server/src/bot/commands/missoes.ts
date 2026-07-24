import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { db } from "@workspace/db";
import { missionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export const data = new SlashCommandBuilder()
  .setName("missoes")
  .setDescription("Lista todas as missões ativas");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: false });

  const missions = await db
    .select()
    .from(missionsTable)
    .where(eq(missionsTable.isActive, true))
    .orderBy(missionsTable.createdAt);

  if (missions.length === 0) {
    const embed = new EmbedBuilder()
      .setTitle("📋 Missões Ativas")
      .setDescription(
        "Nenhuma missão ativa no momento. Peça para um moderador criar uma!",
      )
      .setColor(0x5865f2);

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // Show the first mission with navigation if there are more
  let currentIndex = 0;

  const buildEmbed = (index: number) => {
    const mission = missions[index]!;
    const embed = new EmbedBuilder()
      .setTitle(`🎯 ${mission.title}`)
      .setDescription(mission.description)
      .setColor(0x5865f2)
      .addFields(
        { name: "🆔 ID da Missão", value: String(mission.id), inline: true },
        {
          name: "📅 Criada em",
          value: `<t:${Math.floor(mission.createdAt.getTime() / 1000)}:D>`,
          inline: true,
        },
      )
      .setFooter({
        text: `Missão ${index + 1} de ${missions.length} • Criada por ${mission.createdByName}`,
      });

    if (mission.imageUrl) {
      embed.setImage(mission.imageUrl);
    }

    return embed;
  };

  const buildRow = (index: number) =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("prev_mission")
        .setLabel("◀ Anterior")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(index === 0),
      new ButtonBuilder()
        .setCustomId("next_mission")
        .setLabel("Próxima ▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(index === missions.length - 1),
      new ButtonBuilder()
        .setCustomId("how_to_complete")
        .setLabel("✅ Como completar?")
        .setStyle(ButtonStyle.Primary),
    );

  const reply = await interaction.editReply({
    embeds: [buildEmbed(currentIndex)],
    components: missions.length > 1 ? [buildRow(currentIndex)] : [],
  });

  if (missions.length <= 1) return;

  const collector = reply.createMessageComponentCollector({ time: 120_000 });

  collector.on("collect", async (btn) => {
    if (btn.user.id !== interaction.user.id) {
      await btn.reply({
        content: "Só quem chamou o comando pode navegar pelas missões.",
        ephemeral: true,
      });
      return;
    }

    if (btn.customId === "prev_mission") {
      currentIndex = Math.max(0, currentIndex - 1);
    } else if (btn.customId === "next_mission") {
      currentIndex = Math.min(missions.length - 1, currentIndex + 1);
    } else if (btn.customId === "how_to_complete") {
      await btn.reply({
        content: `Para completar a missão **${missions[currentIndex]!.title}** (ID: \`${missions[currentIndex]!.id}\`), use:\n\`/completar missao_id:${missions[currentIndex]!.id}\` e anexe uma imagem como prova! 📸`,
        ephemeral: true,
      });
      return;
    }

    await btn.update({
      embeds: [buildEmbed(currentIndex)],
      components: [buildRow(currentIndex)],
    });
  });

  collector.on("end", async () => {
    await interaction.editReply({ components: [] }).catch(() => {});
  });
}
