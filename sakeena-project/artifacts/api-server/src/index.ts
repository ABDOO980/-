import { createServer } from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { startNotificationScheduler } from "./scheduler";
import { initRealtime } from "./realtime";
import { seedContentIfEmpty } from "./lib/seed";
import { ensureSchema } from "./lib/ensure-schema";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);
initRealtime(httpServer);

httpServer.on("error", (err) => {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
});

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening");
  void ensureSchema()
    .then(() => seedContentIfEmpty())
    .catch((err) => logger.error({ err }, "database setup failed"));
  startNotificationScheduler();
});
