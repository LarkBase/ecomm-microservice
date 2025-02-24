const rateLimit = require("express-rate-limit");

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per user per windowMs
  keyGenerator: (req) => req.user?.id || req.ip, // Rate-limit based on user ID (or IP if not logged in)
  message: "Too many requests from this user, please try again later.",
});

module.exports = rateLimiter;
