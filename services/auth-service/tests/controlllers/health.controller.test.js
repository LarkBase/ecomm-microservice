const request = require("supertest");
const app = require("../../src/app"); // Adjust the path as necessary
const { PrismaClient } = require("@prisma/client");
const logger = require("../../src/utils/logger");

// Mock Prisma and Logger
jest.mock("@prisma/client", () => {
  return {
    PrismaClient: jest.fn(() => ({
      $queryRaw: jest.fn(),
      $disconnect: jest.fn(),
    })),
  };
});

jest.mock("../../src/utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe("Health Controller", () => {
  let prisma;

  beforeEach(() => {
    prisma = new PrismaClient(); // Create a new instance of the mocked PrismaClient
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /heartbeat/health-check", () => {
    it("should return 200 status and server is running message", async () => {
      const res = await request(app).get("/heartbeat/health-check");

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        success: true,
        message: "Auth Server is up and running!",
      });
      expect(logger.info).toHaveBeenCalledWith("✅ Health Check: Server is running.");
    });
  });

  describe("GET /heartbeat/health-check/detailed", () => {
    it("should return 200 status and detailed health report", async () => {
      // Mock Prisma to resolve successfully
      prisma.$queryRaw.mockResolvedValueOnce();

      const res = await request(app).get("/heartbeat/health-check/detailed");

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        success: true,
        message: "Detailed Health Check Passed",
        server: "Healthy",
        database: "Healthy",
        externalServices: {
          emailService: "Healthy",
          cacheService: "Healthy",
        },
        timestamp: expect.any(String),
      });
      expect(logger.info).toHaveBeenCalledWith("🔍 Running detailed health check...");
      expect(logger.info).toHaveBeenCalledWith("✅ Database is Healthy");
    });
  });
});