import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ChannelType,
} from "discord.js";
import { db } from "@workspace/db";
import { guildConfigTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export const data = new SlashCommandBuilder()
  .setName("bot-configurar")
  .setDescription("Configura as opções do bot de missões")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption((opt) =>
    opt
      .setName("canal_completacoes")
      .setDescription(
        "Canal onde as conclusões de missões serão publicadas (apenas mods veem)",
      )
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildText),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.options.getChannel("canal_completacoes", true);
  const guildId = interaction.guildId;

  if (!guildId) {
    await interaction.editReply({
      content: "❌ Este comando só pode ser usado dentro de um servidor.",
    });
    return;
  }

  await db
    .insert(guildConfigTable)
    .values({ guildId, completionsChannelId: channel.id })
    .onConflictDoUpdate({
      target: guildConfigTable.guildId,
      set: { completionsChannelId: channel.id },
    });

  const embed = new EmbedBuilder()
    .setTitle("⚙️ Configuração Atualizada")
    .setColor(0x5865f2)
    .addFields({
      name: "📣 Canal de Conclusões",
      value: `<#${channel.id}>`,
    })
    .setDescription(
      "Quando um membro completar uma missão usando `/completar`, a prova será enviada para o canal configurado.",
    )
    .setFooter({ text: `Configurado por ${interaction.user.username}` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
