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
  APP_BASE_URL,
} = require("../config/config");

const prisma = new PrismaClient();

// ✅ Register User (with Email Verification)
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // ✅ Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      logger.auth.warn(`Registration failed: Email ${email} already in use.`);
      return res.status(409).json({ success: false, message: "User already exists." });
    }

    // ✅ Hash password securely
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // ✅ Generate verification token
    const verificationToken = uuidv4();

    // ✅ Create user in the database with "PENDING_VERIFICATION" status
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        status: "PENDING_VERIFICATION", // 🔥 User must verify email before login
        tenantId: "tenant-001",
        verificationToken,
      },
    });

    logger.audit.info(`User registered with PENDING_VERIFICATION status: ${email}`);

    // ✅ Generate email verification link
    const verificationLink = `${APP_BASE_URL}/api/auth/verify-email?token=${verificationToken}`;

    // ✅ Send verification email
    const emailResponse = await sendEmail(
      email,
      "Verify Your Email - E-Commerce",
      `Please click the link to verify your email: ${verificationLink}`,
      `<p>Please click <a href="${verificationLink}">here</a> to verify your email.</p>`
    );

    if (!emailResponse.success) {
      logger.errorLog.error(`❌ Failed to send verification email to ${email}`);
      return res.status(500).json({
        success: false,
        message: "User registered, but verification email failed to send. Please contact support.",
      });
    }

    logger.auth.info(`✅ User registered successfully & verification email sent: ${email}`);

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please check your email to verify your account.",
      userId: newUser.id,
    });

  } catch (error) {
    logger.errorLog.error(`❌ Registration error: ${error.stack}`);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ✅ Verify Email Controller 
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      logger.auth.warn("⚠️ Email verification failed: No token provided.");
      return res.status(400).json({ success: false, message: "Verification token is required." });
    }

    logger.auth.info(`🔍 Verifying email with token: ${token}`);

    // ✅ Find user by verification token
    const user = await prisma.user.findUnique({ where: { verificationToken: token } });

    if (!user) {
      logger.auth.warn(`❌ Email verification failed: Invalid or expired token.`);
      return res.status(400).json({ success: false, message: "Invalid or expired token." });
    }

    // ✅ Update user status to ACTIVE, mark email as verified & remove verification token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: "ACTIVE",  // ✅ Activate user after verification
        emailVerified: true, // ✅ Mark email as verified
        verificationToken: null, // ✅ Remove token after verification
      },
    });

    logger.auth.info(`✅ Email verified successfully for ${user.email}`);
    
    res.json({ success: true, message: "Email verification successful. You can now log in." });

  } catch (error) {
    logger.errorLog.error(`❌ Email verification error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Internal Server Error", details: error.message });
  }
};

// ✅ Login User with Email Verification Check & Security Enhancements
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Validate request body
    if (!email || !password) {
      logger.auth.warn(`⚠️ Login failed: Missing email or password.`);
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    // ✅ Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      logger.auth.warn(`❌ Login failed: Email ${email} not found.`);
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // ✅ Check if email is verified
    if (user.status === "PENDING_VERIFICATION" || !user.emailVerified) {
      logger.auth.warn(`🚫 Login blocked: ${email} has not verified email.`);
      return res.status(403).json({ success: false, message: "Email not verified. Please check your inbox." });
    }

    // ✅ Validate password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      logger.auth.warn(`❌ Failed login: Incorrect password for ${email}`);
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // ✅ Generate JWT Access Token (Short-lived)
    const accessToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRY, // e.g., "15m"
    });

    // ✅ Generate Refresh Token (Long-lived)
    const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRY, // e.g., "7d"
    });

    // ✅ Store Refresh Token in Database (Token Rotation Support)
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } }); // Remove old tokens
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        createdAt: new Date(),
        expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      },
    });

    // ✅ Set Secure HTTP-only Cookie for Refresh Token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.auth.info(`✅ User ${user.id} logged in successfully.`);
    res.json({ success: true, accessToken, message: "Login successful" });

  } catch (error) {
    logger.errorLog.error(`❌ Login error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Internal Server Error", details: error.message });
  }
};


// ✅ Refresh Access Token with Token Rotation
exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      logger.auth.warn("⚠️ Refresh token missing in request.");
      return res.status(403).json({ success: false, message: "Refresh token missing" });
    }

    // ✅ Check if refresh token exists in DB
    const existingToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });

    if (!existingToken) {
      logger.auth.warn("🚨 Invalid refresh token attempt.");
      return res.status(403).json({ success: false, message: "Invalid refresh token" });
    }

    // ✅ Verify Refresh Token
    jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err || !decoded?.userId) {
        logger.auth.warn("🚫 Refresh token verification failed.");
        return res.status(403).json({ success: false, message: "Invalid or expired refresh token" });
      }

      // ✅ Generate New Access Token (Short-lived)
      const newAccessToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: "15m" });

      // ✅ Implement Token Rotation (Issue new refresh token)
      const newRefreshToken = jwt.sign({ userId: decoded.userId }, JWT_REFRESH_SECRET, { expiresIn: "7d" });

      // ✅ Store new refresh token & delete old one
      await prisma.refreshToken.deleteMany({ where: { userId: decoded.userId } });

      await prisma.refreshToken.create({
        data: {
          userId: decoded.userId,
          token: newRefreshToken,
          expiresIn: 60 * 60 * 24 * 7, // ✅ Store as INTEGER (7 days in seconds)
        },
      });

      // ✅ Send new refresh token as HTTP-only cookie
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      logger.auth.info(`✅ New access & refresh tokens issued for User ID: ${decoded.userId}`);

      res.json({ success: true, accessToken: newAccessToken });
    });

  } catch (error) {
    logger.errorLog.error(`❌ Refresh Token Error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Internal Server Error", details: error.message });
  }
};


// ✅ Forgot Password (Improved Logging & Debugging)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      logger.auth.warn("⚠️ Forgot Password failed: No email provided.");
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    logger.auth.info(`🔍 Forgot Password attempt for email: ${email}`);

    // ✅ Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      logger.auth.warn(`❌ Forgot Password failed: User not found (${email})`);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ Generate reset token & expiration (1 hour)
    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); 

    // ✅ Store reset token & expiry in DB
    await prisma.user.update({
      where: { email },
      data: { passwordResetToken: resetToken, passwordResetTokenExpiry: resetTokenExpiry },
    });

    const resetLink = `${APP_BASE_URL}/api/auth/reset-password?token=${resetToken}`;
    logger.auth.info(`🔗 Generated reset link for ${email}: ${resetLink}`);

    // ✅ Send email
    const emailResponse = await sendEmail(
      email,
      "Password Reset Request",
      `Please click the link to reset your password: ${resetLink}`,
      `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
    );

    if (!emailResponse.success) {
      logger.errorLog.error(`❌ Failed to send password reset email to ${email}`);
      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email. Please try again later.",
      });
    }

    logger.auth.info(`✅ Password reset link sent successfully to ${email}`);
    res.json({ success: true, message: "Password reset email sent." });

  } catch (error) {
    logger.errorLog.error(`❌ Forgot Password Error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ✅ Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // ✅ Check if the reset token exists and is valid
    const user = await prisma.user.findFirst({
      where: { passwordResetToken: token },
    });

    if (!user) {
      logger.auth.warn("❌ Password reset failed: Invalid or expired token.");
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    if (!user.passwordResetTokenExpiry || user.passwordResetTokenExpiry < new Date()) {
      logger.auth.warn(`❌ Password reset failed: Token expired for user ${user.email}`);
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    // ✅ Hash new password securely
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    // ✅ Ensure the new password is different from the old one
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      logger.auth.warn(`⚠️ Password reset attempt with the same password for ${user.email}`);
      return res.status(400).json({ success: false, message: "New password cannot be the same as the old password." });
    }

    // ✅ Update password & remove reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExpiry: null,
      },
    });

    // ✅ OPTIONAL: Invalidate all active sessions
    await prisma.session.deleteMany({ where: { userId: user.id } });

    logger.auth.info(`✅ Password reset successful for ${user.email}`);
    res.json({ success: true, message: "Password reset successful!" });

  } catch (error) {
    logger.errorLog.error(`❌ Reset Password Error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ✅ Logout User
exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      logger.auth.warn("❌ Logout attempt with no refresh token.");
      return res.status(400).json({ success: false, message: "No refresh token provided" });
    }

    // ✅ Find the refresh token in DB
    const existingToken = await prisma.refreshToken.findFirst({
      where: { token: refreshToken },
    });

    if (!existingToken) {
      logger.auth.warn("❌ Logout attempt with an invalid or expired refresh token.");
      return res.status(400).json({ success: false, message: "Invalid or expired refresh token" });
    }

    // ✅ Delete refresh token(s) from DB (Logout from all sessions if needed)
    await prisma.refreshToken.deleteMany({ where: { userId: existingToken.userId } });

    // ✅ OPTIONAL: Remove all active sessions for user
    await prisma.session.deleteMany({ where: { userId: existingToken.userId } });

    // ✅ Clear refresh token from cookies
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    logger.auth.info(`✅ User ${existingToken.userId} logged out successfully.`);
    res.json({ success: true, message: "Logged out successfully" });

  } catch (error) {
    logger.errorLog.error(`❌ Logout Error: ${error.stack}`);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
