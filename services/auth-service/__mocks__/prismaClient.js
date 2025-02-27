const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Mock Prisma functions
prisma.user = {
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  deleteMany: jest.fn(),
};

prisma.refreshToken = {
  findUnique: jest.fn(),
  create: jest.fn(),
  deleteMany: jest.fn(),
};
prisma.$queryRaw = jest.fn();
prisma.$executeRaw = jest.fn();

module.exports = prisma;
