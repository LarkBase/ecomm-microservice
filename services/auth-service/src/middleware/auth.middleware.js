const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/config");
const logger = require("../utils/logger");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      logger.warn("Unauthorized request - Missing token");
      return res.status(401).json({ success: false, message: "Unauthorized access. No token provided." });
    }

    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    
    logger.info(`User authenticated: ${decoded.email}`);
    next();
  } catch (error) {
    logger.error("Invalid token or expired session");
    return res.status(401).json({ success: false, message: "Invalid or expired token. Please log in again." });
  }
};
