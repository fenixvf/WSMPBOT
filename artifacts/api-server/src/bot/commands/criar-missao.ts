import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { db } from "@workspace/db";
import { missionsTable } from "@workspace/db";

export const data = new SlashCommandBuilder()
  .setName("missao-criar")
  .setDescription("Cria uma nova missão diária")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addStringOption((opt) =>
    opt
      .setName("titulo")
      .setDescription("Título da missão")
      .setRequired(true)
      .setMaxLength(100),
  )
  .addStringOption((opt) =>
    opt
      .setName("descricao")
      .setDescription("Descrição detalhada da missão")
      .setRequired(true)
      .setMaxLength(1000),
  )
  .addAttachmentOption((opt) =>
    opt
      .setName("imagem")
      .setDescription("Imagem ilustrativa da missão (opcional)")
      .setRequired(false),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const titulo = interaction.options.getString("titulo", true);
  const descricao = interaction.options.getString("descricao", true);
  const imagem = interaction.options.getAttachment("imagem");

  const imageUrl = imagem?.url ?? null;

  const [mission] = await db
    .insert(missionsTable)
    .values({
      title: titulo,
      description: descricao,
      imageUrl,
      createdBy: interaction.user.id,
      createdByName: interaction.user.username,
    })
    .returning();

  const embed = new EmbedBuilder()
    .setTitle("✅ Missão criada com sucesso!")
    .setColor(0x00cc66)
    .addFields(
      { name: "📋 Título", value: mission!.title },
      { name: "📝 Descrição", value: mission!.description },
      { name: "🆔 ID", value: String(mission!.id), inline: true },
    )
    .setFooter({ text: `Criada por ${interaction.user.username}` })
    .setTimestamp();

  if (imageUrl) {
    embed.setImage(imageUrl);
  }

  await interaction.editReply({ embeds: [embed] });
}
