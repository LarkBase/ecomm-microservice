const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const logger = require("../utils/logger");
const { v4: uuidv4 } = require("uuid");
const sendEmail = require("../services/email.service");
const {
  JWT_SECRET,
  JWT_EXPIRY,
  JWT_REFRESH_EXPIRY,
  JWT_REFRESH_SECRET,
  BCRYPT_SALT_ROUNDS,
} = require("../config/config");

const prisma = new PrismaClient();

// ✅ Register User
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      logger.warn(`Registration failed: Email ${email} already in use.`);
      return res.status(409).json({ success: false, message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        status: "PENDING_VERIFICATION",
        tenantId: "tenant-001",
      },
    });

    logger.info(`User registered successfully: ${email}`);
    return res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email.",
      userId: newUser.id,
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ✅ Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const accessToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });

    await prisma.refreshToken.create({
      data: { userId: user.id, token: refreshToken, createdAt: new Date(), expiresIn: 604800 },
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, accessToken, message: "Login successful" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", details: error.message });
  }
};

// ✅ Refresh Token
exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(403).json({ success: false, message: "Refresh token missing" });
    }

    const existingToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!existingToken) {
      return res.status(403).json({ success: false, message: "Invalid refresh token" });
    }

    jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) return res.status(403).json({ success: false, message: "Invalid refresh token" });

      const newAccessToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: "15m" });

      res.json({ success: true, accessToken: newAccessToken });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", details: error.message });
  }
};

// ✅ Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store reset token & expiry in DB
    await prisma.user.update({
      where: { email },
      data: {
        passwordResetToken: resetToken,
        passwordResetTokenExpiry: resetTokenExpiry, // 🔥 This will now work!
      },
    });

    const resetLink = `http://localhost:5000/api/auth/reset-password?token=${resetToken}`;

    // Send email
    await sendEmail(email, "Password Reset Request", resetLink);

    res.json({ success: true, message: "Password reset email sent." });
  } catch (error) {
    console.error(`Forgot Password Error: ${error.message}`);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ✅ Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await prisma.user.findFirst({ where: { passwordResetToken: token } });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, passwordResetToken: null },
    });

    res.json({ success: true, message: "Password reset successful!" });
  } catch (error) {
    res.status(400).json({ success: false, message: "Invalid or expired token" });
  }
};

// ✅ Logout User
exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
      res.clearCookie("refreshToken");
    }
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error", details: error.message });
  }
};
