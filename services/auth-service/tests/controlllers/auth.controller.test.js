const request = require("supertest");
const app = require("../../src/app");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const logger = require("../../src/utils/logger");
const {
  JWT_SECRET,
  JWT_EXPIRY,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRY,
  BCRYPT_SALT_ROUNDS,
  APP_BASE_URL,
} = require("../../src/config/config");

// Mock external dependencies
jest.mock("../../src/utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  audit: { info: jest.fn(), warn: jest.fn() },
  errorLog: { error: jest.fn() },
  auth: { info: jest.fn(), warn: jest.fn() },
}));

jest.mock("../../src/services/email.service", () => ({
  sendEmail: jest.fn().mockImplementation((to, subject, text, html) => {
    if (to === "fail@example.com") {
      return { success: false, message: "Email sending failed" };
    }
    return { success: true, message: "Email sent successfully" };
  }),
}));

describe("Auth Controller", () => {
  let user;
  let verificationToken;
  let refreshToken;

  beforeAll(async () => {
    // Clear the database before running tests
    await prisma.user.deleteMany({});
    await prisma.refreshToken.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // describe("POST /api/auth/register", () => {
  //   it('should register a new user and return 201 status', async () => {
  //       const res = await request(app)
  //         .post('/api/auth/register')
  //         .send({
  //           name: 'Test User',
  //           email: 'test@example.com',
  //           password: 'password123',
  //           confirmPassword: 'password123',
  //         });
  
  //       expect(res.statusCode).toEqual(201);
  //       expect(res.body).toHaveProperty('success', true);
  //       expect(res.body).toHaveProperty('message', 'Registration successful. Please check your email to verify your account.');
  //     });

  //     it("should return 409 status if email already exists", async () => {
  //       // Create a user first to simulate duplicate email
  //       await prisma.user.create({
  //         data: {
  //           email: "duplicate@example.com",
  //           password: await bcrypt.hash("password123", BCRYPT_SALT_ROUNDS),
  //           name: "Test User",
  //           status: "PENDING_VERIFICATION",
  //           tenantId: "tenant-001",
  //           verificationToken: uuidv4(),
  //         },
  //       });
      
  //       const res = await request(app)
  //         .post("/api/auth/register")
  //         .send({
  //           name: "Test User",
  //           email: "duplicate@example.com",
  //           password: "password123",
  //           confirmPassword: "password123",
  //         });
      
  //       expect(res.statusCode).toEqual(409);
  //       expect(res.body).toHaveProperty("success", false);
  //       expect(res.body).toHaveProperty("message", "User already exists.");
  //     });

  //   it("should return 409 status if email already exists", async () => {
  //     const res = await request(app)
  //       .post("/api/auth/register")
  //       .send({
  //         name: "Test User",
  //         email: "test@example.com",
  //         password: "password123",
  //         confirmPassword: "password123",
  //       });

  //     expect(res.statusCode).toEqual(409);
  //     expect(res.body).toHaveProperty("success", false);
  //     expect(res.body).toHaveProperty("message", "User already exists.");
  //   });

  //   it("should return 500 status if email sending fails", async () => {
  //       // Mock email service to fail for a specific email
  //       require("../../src/services/email.service").sendEmail.mockResolvedValueOnce({
  //         success: false,
  //         message: "Email sending failed",
  //       });
      
  //       const res = await request(app)
  //         .post("/api/auth/register")
  //         .send({
  //           name: "Test User",
  //           email: "fail@example.com",
  //           password: "password123",
  //           confirmPassword: "password123",
  //         });
      
  //       expect(res.statusCode).toEqual(500);
  //       expect(res.body).toHaveProperty("success", false);
  //       expect(res.body).toHaveProperty(
  //         "message",
  //         "User registered, but verification email failed to send. Please contact support."
  //       );
  //     });
  // });

  // describe("GET /api/auth/verify-email", () => {
  //   it("should verify email and return 200 status", async () => {
  //     // Create a user with a valid verification token
  //     const user = await prisma.user.create({
  //       data: {
  //         email: "verify@example.com",
  //         password: await bcrypt.hash("password123", BCRYPT_SALT_ROUNDS),
  //         name: "Verify User",
  //         status: "PENDING_VERIFICATION",
  //         tenantId: "tenant-001",
  //         verificationToken: uuidv4(),
  //       },
  //     });

  //     const res = await request(app)
  //       .get("/api/auth/verify-email")
  //       .query({ token: user.verificationToken });

  //     expect(res.statusCode).toEqual(200);
  //     expect(res.body).toHaveProperty("success", true);
  //     expect(res.body).toHaveProperty(
  //       "message",
  //       "Email verification successful. You can now log in."
  //     );
  //   });

  //   it("should return 400 status if token is invalid", async () => {
  //     const res = await request(app)
  //       .get("/api/auth/verify-email")
  //       .query({ token: "invalid-token" });

  //     expect(res.statusCode).toEqual(400);
  //     expect(res.body).toHaveProperty("success", false);
  //     expect(res.body).toHaveProperty("message", "Invalid or expired token.");
  //   });

  //   it("should return 400 status if no token is provided", async () => {
  //     const res = await request(app).get("/api/auth/verify-email");

  //     expect(res.statusCode).toEqual(400);
  //     expect(res.body).toHaveProperty("success", false);
  //     expect(res.body).toHaveProperty("message", "Verification token is required.");
  //   });
  // });

  describe("POST /api/auth/login", () => {
    it("should login user and return 200 status", async () => {
      // Create a verified user
      const user = await prisma.user.create({
        data: {
          email: "login@example.com",
          password: await bcrypt.hash("password123", BCRYPT_SALT_ROUNDS),
          name: "Login User",
          status: "ACTIVE",
          emailVerified: true,
          tenantId: "tenant-001",
        },
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "login@example.com",
          password: "password123",
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("message", "Login successful");
      expect(res.body).toHaveProperty("accessToken");
    });

    it("should return 401 status if credentials are invalid", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "Invalid credentials");
    });

    it("should return 403 status if email is not verified", async () => {
      // Create a user with unverified email
      await prisma.user.create({
        data: {
          email: "unverified@example.com",
          password: await bcrypt.hash("password123", BCRYPT_SALT_ROUNDS),
          name: "Unverified User",
          status: "PENDING_VERIFICATION",
          tenantId: "tenant-001",
          verificationToken: uuidv4(),
        },
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "unverified@example.com",
          password: "password123",
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "Email not verified. Please check your inbox.");
    });
  });

  describe("POST /api/auth/refresh-token", () => {
    it("should refresh access token and return 200 status", async () => {
      // Create a user and a valid refresh token
      const user = await prisma.user.create({
        data: {
          email: "refresh@example.com",
          password: await bcrypt.hash("password123", BCRYPT_SALT_ROUNDS),
          name: "Refresh User",
          status: "ACTIVE",
          emailVerified: true,
          tenantId: "tenant-001",
        },
      });

      const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRY,
      });

      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresIn: 7 * 24 * 60 * 60, // 7 days
        },
      });

      const res = await request(app)
        .post("/api/auth/refresh-token")
        .set("Cookie", [`refreshToken=${refreshToken}`]);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("accessToken");
    });

    it("should return 403 status if refresh token is invalid", async () => {
      const res = await request(app)
        .post("/api/auth/refresh-token")
        .set("Cookie", ["refreshToken=invalid-token"]);

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "Invalid refresh token");
    });

    it("should return 403 status if no refresh token is provided", async () => {
      const res = await request(app).post("/api/auth/refresh-token");

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "Refresh token missing");
    });
  });

  // describe("POST /api/auth/forgot-password", () => {
  //   it("should send password reset email and return 200 status", async () => {
  //     // Create a user
  //     await prisma.user.create({
  //       data: {
  //         email: "forgot@example.com",
  //         password: await bcrypt.hash("password123", BCRYPT_SALT_ROUNDS),
  //         name: "Forgot User",
  //         status: "ACTIVE",
  //         emailVerified: true,
  //         tenantId: "tenant-001",
  //       },
  //     });

  //     const res = await request(app)
  //       .post("/api/auth/forgot-password")
  //       .send({ email: "forgot@example.com" });

  //     expect(res.statusCode).toEqual(200);
  //     expect(res.body).toHaveProperty("success", true);
  //     expect(res.body).toHaveProperty("message", "Password reset email sent.");
  //   });

  //   it("should return 404 status if email does not exist", async () => {
  //     const res = await request(app)
  //       .post("/api/auth/forgot-password")
  //       .send({ email: "nonexistent@example.com" });

  //     expect(res.statusCode).toEqual(404);
  //     expect(res.body).toHaveProperty("success", false);
  //     expect(res.body).toHaveProperty("message", "User not found");
  //   });

  //   it("should return 500 status if email sending fails", async () => {
  //       // Mock email service to fail
  //       require("../../src/services/email.service").sendEmail.mockResolvedValueOnce({
  //         success: false,
  //         message: "Email sending failed",
  //       });
      
  //       const res = await request(app)
  //         .post("/api/auth/forgot-password")
  //         .send({ email: "fail@example.com" });
      
  //       expect(res.statusCode).toEqual(500);
  //       expect(res.body).toHaveProperty("success", false);
  //       expect(res.body).toHaveProperty(
  //         "message",
  //         "Failed to send password reset email. Please try again later."
  //       );
  //     });
  // });

  // describe("POST /api/auth/reset-password", () => {
  //   it("should reset password and return 200 status", async () => {
  //     const resetToken = uuidv4();
  //     const user = await prisma.user.create({
  //       data: {
  //         email: "reset@example.com",
  //         password: await bcrypt.hash("password123", BCRYPT_SALT_ROUNDS),
  //         name: "Reset User",
  //         status: "ACTIVE",
  //         emailVerified: true,
  //         tenantId: "tenant-001",
  //         passwordResetToken: resetToken,
  //         passwordResetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  //       },
  //     });

  //     const res = await request(app)
  //       .post("/api/auth/reset-password")
  //       .send({ token: resetToken, newPassword: "newpassword123" });

  //     expect(res.statusCode).toEqual(200);
  //     expect(res.body).toHaveProperty("success", true);
  //     expect(res.body).toHaveProperty("message", "Password reset successful!");
  //   });

  //   it("should return 400 status if token is invalid or expired", async () => {
  //     const res = await request(app)
  //       .post("/api/auth/reset-password")
  //       .send({ token: "invalid-token", newPassword: "newpassword123" });

  //     expect(res.statusCode).toEqual(400);
  //     expect(res.body).toHaveProperty("success", false);
  //     expect(res.body).toHaveProperty("message", "Invalid or expired token");
  //   });

  //   it("should return 400 status if new password is the same as the old one", async () => {
  //     const resetToken = uuidv4();
  //     const user = await prisma.user.create({
  //       data: {
  //         email: "samepassword@example.com",
  //         password: await bcrypt.hash("password123", BCRYPT_SALT_ROUNDS),
  //         name: "Same Password User",
  //         status: "ACTIVE",
  //         emailVerified: true,
  //         tenantId: "tenant-001",
  //         passwordResetToken: resetToken,
  //         passwordResetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  //       },
  //     });

  //     const res = await request(app)
  //       .post("/api/auth/reset-password")
  //       .send({ token: resetToken, newPassword: "password123" });

  //     expect(res.statusCode).toEqual(400);
  //     expect(res.body).toHaveProperty("success", false);
  //     expect(res.body).toHaveProperty(
  //       "message",
  //       "New password cannot be the same as the old password."
  //     );
  //   });
  // });

  describe("POST /api/auth/logout", () => {
    it("should logout user and return 200 status", async () => {
      // Create a user and a valid refresh token
      const user = await prisma.user.create({
        data: {
          email: "logout@example.com",
          password: await bcrypt.hash("password123", BCRYPT_SALT_ROUNDS),
          name: "Logout User",
          status: "ACTIVE",
          emailVerified: true,
          tenantId: "tenant-001",
        },
      });

      const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRY,
      });

      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresIn: 7 * 24 * 60 * 60, // 7 days
        },
      });

      const res = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", [`refreshToken=${refreshToken}`]);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("message", "Logged out successfully");
    });

    it("should return 400 status if no refresh token is provided", async () => {
      const res = await request(app).post("/api/auth/logout");

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "No refresh token provided");
    });

    it("should return 400 status if refresh token is invalid", async () => {
      const res = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", ["refreshToken=invalid-token"]);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "Invalid or expired refresh token");
    });
  });
});