const http = require("http");
const app = require("./app");
const { PORT } = require("./config/config");
const logger = require("./utils/logger");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const server = http.createServer(app);

// ✅ Graceful Shutdown
const shutdown = async () => {
  logger.info("🔻 Server shutting down...");

  try {
    await prisma.$disconnect(); // ✅ Disconnect Prisma before closing server
    logger.info("✅ Prisma Client disconnected.");
  } catch (error) {
    logger.error(`❌ Error disconnecting Prisma: ${error.message}`);
  }

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
