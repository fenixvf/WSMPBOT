import { REST, Routes, OAuth2Scopes, PermissionFlagsBits } from "discord.js";
import { logger } from "../lib/logger";
import * as criarMissao from "./commands/criar-missao";
import * as missoes from "./commands/missoes";
import * as deletarMissao from "./commands/deletar-missao";
import * as completar from "./commands/completar";
import * as configurar from "./commands/configurar";

const commands = [
  criarMissao.data,
  missoes.data,
  deletarMissao.data,
  completar.data,
  configurar.data,
];

export function getInviteUrl(clientId: string): string {
  const perms =
    PermissionFlagsBits.SendMessages |
    PermissionFlagsBits.EmbedLinks |
    PermissionFlagsBits.AttachFiles |
    PermissionFlagsBits.ReadMessageHistory |
    PermissionFlagsBits.CreatePublicThreads |
    PermissionFlagsBits.CreatePrivateThreads;

  const scopes = [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands].join(
    "%20",
  );

  return `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=${scopes}&permissions=${perms}`;
}

export async function deployCommands(): Promise<void> {
  const token = process.env["DISCORD_BOT_TOKEN"];
  const clientId = process.env["DISCORD_CLIENT_ID"];
  const guildId = process.env["DISCORD_GUILD_ID"];

  if (!token || !clientId || !guildId) {
    throw new Error(
      "DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID e DISCORD_GUILD_ID são obrigatórios.",
    );
  }

  const inviteUrl = getInviteUrl(clientId);

  const rest = new REST().setToken(token);
  const commandsJson = commands.map((c) => c.toJSON());

  try {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commandsJson,
    });
    logger.info(
      { count: commands.length },
      "Slash commands registrados no servidor com sucesso",
    );
  } catch (err: unknown) {
    const code = (err as { code?: number }).code;
    if (code === 50001) {
      logger.warn(
        "Bot não está no servidor ou falta o escopo 'applications.commands'.",
      );
      logger.warn(
        `\n\n🔗 CONVIDE O BOT PARA O SEU SERVIDOR usando este link:\n${inviteUrl}\n\nDepois de convidar, reinicie o servidor.\n`,
      );
    } else {
      throw err;
    }
  }
}
