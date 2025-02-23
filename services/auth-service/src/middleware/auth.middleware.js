const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/config");
const logger = require("../utils/logger");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      logger.auth.warn(`Unauthorized request from IP: ${req.ip} - Missing token`);
      return res.status(401).json({ success: false, message: "Unauthorized access. No token provided." });
    }

    // Verify JWT Token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        logger.auth.warn(`Invalid token attempt from IP: ${req.ip} - ${err.message}`);
        return res.status(401).json({ success: false, message: "Invalid or expired token. Please log in again." });
      }

      req.user = decoded; // Attach user data to request
      logger.auth.info(`✅ User authenticated: ${decoded.email} (ID: ${decoded.userId})`);
      next();
    });

  } catch (error) {
    logger.error(`Authentication Error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
