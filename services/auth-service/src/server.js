const http = require("http");
const app = require("./app");
const { PORT } = require("./config/config");
const logger = require("./utils/logger");

const server = http.createServer(app);

// ✅ Graceful Shutdown
const shutdown = () => {
  logger.info("🔻 Server shutting down...");
  server.close(() => {
    logger.info("✅ Server successfully closed.");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});
