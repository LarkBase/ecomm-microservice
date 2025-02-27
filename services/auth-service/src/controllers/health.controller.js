const logger = require("../utils/logger");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient(); // ✅ Initialize Prisma Client

// ✅ Basic Health Check - Returns "OK" if the server is up
exports.basicHealthCheck = (req, res) => {
  logger.info("✅ Health Check: Server is running.");
  res.status(200).json({ success: true, message: "Auth Server is up and running!" });
};

// ✅ Detailed Health Check - Checks DB & Other Services
exports.detailedHealthCheck = async (req, res) => {
  try {
    logger.info("🔍 Running detailed health check...");

    // ✅ Check Database Connection
    logger.info("⏳ Checking Database Connection...");
    await prisma.$queryRaw`SELECT 1`; // This should throw an error if the database is down
    logger.info("✅ Database is Healthy");

    // ✅ Check External Services (e.g., Email Service)
    const externalServices = await checkExternalServices();
    logger.info("✅ External Services Check Complete");

    const healthReport = {
      success: true,
      message: "Detailed Health Check Passed",
      server: "Healthy",
      database: "Healthy",
      externalServices,
      timestamp: new Date().toISOString(),
    };

    logger.info("✅ Detailed Health Check Passed:", healthReport);
    res.status(200).json(healthReport);
  } catch (error) {
    logger.error(`❌ Health Check Failed: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Server is running, but some dependencies failed.",
      error: error.message,
    });
  }
};

// ✅ Check External Services (Mocked for now)
const checkExternalServices = async () => {
  // Example: Check email service, cache, etc.
  return {
    emailService: "Healthy", // Mocked
    cacheService: "Healthy", // Mocked
  };
};

// ✅ Gracefully disconnect Prisma Client on process exit
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  logger.info("🔌 Prisma Client disconnected.");
  process.exit(0);
});