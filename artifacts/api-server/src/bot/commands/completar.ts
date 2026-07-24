import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import { db } from "@workspace/db";
import {
  missionsTable,
  completionsTable,
  guildConfigTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";

export const data = new SlashCommandBuilder()
  .setName("completar")
  .setDescription("Envia a conclusão de uma missão com imagem como prova")
  .addIntegerOption((opt) =>
    opt
      .setName("missao_id")
      .setDescription("ID da missão que você completou")
      .setRequired(true)
      .setMinValue(1),
  )
  .addAttachmentOption((opt) =>
    opt
      .setName("imagem")
      .setDescription("Foto/imagem comprovando que você completou a missão")
      .setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const missionId = interaction.options.getInteger("missao_id", true);
  const attachment = interaction.options.getAttachment("imagem", true);

  // Check if attachment is an image
  if (!attachment.contentType?.startsWith("image/")) {
    await interaction.editReply({
      content: "❌ Por favor, envie apenas imagens (PNG, JPG, GIF, WEBP).",
    });
    return;
  }

  // Verify mission exists and is active
  const [mission] = await db
    .select()
    .from(missionsTable)
    .where(
      and(eq(missionsTable.id, missionId), eq(missionsTable.isActive, true)),
    );

  if (!mission) {
    await interaction.editReply({
      content: `❌ Missão com ID \`${missionId}\` não encontrada ou não está ativa. Use \`/missoes\` para ver as missões disponíveis.`,
    });
    return;
  }

  // Check if user already completed this mission
  const [existing] = await db
    .select()
    .from(completionsTable)
    .where(
      and(
        eq(completionsTable.missionId, missionId),
        eq(completionsTable.userId, interaction.user.id),
      ),
    );

  if (existing) {
    await interaction.editReply({
      content: `⚠️ Você já completou a missão **${mission.title}** anteriormente! Cada missão pode ser completada apenas uma vez.`,
    });
    return;
  }

  // Save completion to DB
  await db.insert(completionsTable).values({
    missionId,
    userId: interaction.user.id,
    userName: interaction.user.username,
    imageUrl: attachment.url,
  });

  // Try to post in completions channel
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.editReply({
      content: "❌ Este comando só pode ser usado dentro de um servidor.",
    });
    return;
  }

  const [config] = await db
    .select()
    .from(guildConfigTable)
    .where(eq(guildConfigTable.guildId, guildId));

  const completionEmbed = new EmbedBuilder()
    .setTitle("🏆 Missão Completada!")
    .setColor(0xf1c40f)
    .setDescription(
      `<@${interaction.user.id}> completou a missão **${mission.title}**`,
    )
    .addFields(
      { name: "📋 Missão", value: mission.title, inline: true },
      { name: "🆔 ID", value: String(mission.id), inline: true },
      {
        name: "📅 Completada em",
        value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
      },
    )
    .setImage(attachment.url)
    .setThumbnail(
      interaction.user.displayAvatarURL({ size: 128 }),
    )
    .setFooter({
      text: `${interaction.user.username} • ${interaction.guild?.name ?? "Servidor"}`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setTimestamp();

  if (config?.completionsChannelId) {
    try {
      const channel = await interaction.guild?.channels.fetch(
        config.completionsChannelId,
      );
      if (channel && channel.isTextBased()) {
        await (channel as TextChannel).send({ embeds: [completionEmbed] });
      }
    } catch {
      // Channel might have been deleted or bot lost access — still confirm to user
    }
  }

  // Confirm to the user (ephemeral)
  const confirmEmbed = new EmbedBuilder()
    .setTitle("✅ Conclusão enviada!")
    .setColor(0x00cc66)
    .setDescription(
      `Sua conclusão da missão **${mission.title}** foi registrada com sucesso!`,
    )
    .setImage(attachment.url)
    .setTimestamp();

  if (!config?.completionsChannelId) {
    confirmEmbed.addFields({
      name: "⚙️ Aviso",
      value:
        "Nenhum canal de conclusões configurado. Peça para um admin usar `/bot-configurar` para definir o canal onde as conclusões aparecem.",
    });
  }

  await interaction.editReply({ embeds: [confirmEmbed] });
}
