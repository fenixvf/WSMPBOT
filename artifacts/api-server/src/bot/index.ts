import {
  Client,
  GatewayIntentBits,
  Interaction,
  ChatInputCommandInteraction,
} from "discord.js";
import { logger } from "../lib/logger";
import { deployCommands } from "./deploy-commands";
import * as criarMissao from "./commands/criar-missao";
import * as missoes from "./commands/missoes";
import * as deletarMissao from "./commands/deletar-missao";
import * as completar from "./commands/completar";
import * as configurar from "./commands/configurar";

type CommandModule = {
  data: { name: string };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

const commandMap = new Map<string, CommandModule>([
  ["missao-criar", criarMissao],
  ["missoes", missoes],
  ["missao-deletar", deletarMissao],
  ["completar", completar],
  ["bot-configurar", configurar],
]);

export async function startBot() {
  const token = process.env["DISCORD_BOT_TOKEN"];
  if (!token) {
    throw new Error("DISCORD_BOT_TOKEN não configurado.");
  }

  // Register slash commands first
  await deployCommands();

  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  client.once("ready", (c) => {
    logger.info({ tag: c.user.tag }, "Bot Discord conectado");
  });

  client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commandMap.get(interaction.commandName);

    if (!command) {
      logger.warn({ commandName: interaction.commandName }, "Comando desconhecido");
      return;
    }

    try {
      await command.execute(interaction);
    } catch (err) {
      logger.error({ err, commandName: interaction.commandName }, "Erro ao executar comando");

      const errorMessage = "❌ Ocorreu um erro ao executar este comando. Tente novamente.";
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: errorMessage }).catch(() => {});
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => {});
      }
    }
  });

  await client.login(token);
  return client;
}
