import app from "./app";
import { logger } from "./lib/logger";
import { startBot } from "./bot";

const rawPort = process.env["PORT"];

if (rawPort) {
  const port = Number(rawPort);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
} else {
  logger.info("PORT not provided; running as a Discord bot worker");
}

startBot().catch((err) => {
  logger.error({ err }, "Falha ao iniciar o bot do Discord");
  // In production, let Render restart the worker and surface the real failure.
  if (process.env["NODE_ENV"] === "production") {
    process.exit(1);
  }
});
