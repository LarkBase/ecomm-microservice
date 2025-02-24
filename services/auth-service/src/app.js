const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { RATE_LIMIT } = require("./config/config");
const logger = require("./utils/logger");
const cookieParser = require("cookie-parser");
const setupSwagger = require("./config/swaggerConfig");

const app = express();

// ✅ Middleware
app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded requests
app.use(cookieParser());
app.use(cors({
    origin: "*", 
    credentials: true, 
  }));

app.use(helmet()); // Security headers
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
); // Log HTTP requests to logger

// ✅ Rate Limiting - Prevent brute force attacks
const limiter = rateLimit({
  windowMs: RATE_LIMIT.windowMs,
  max: RATE_LIMIT.max,
  message: "Too many requests, please try again later.",
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded: ${req.ip}`);
    res.status(429).json({ success: false, message: "Too many requests, please try again later." });
  },
});
app.use(limiter);

// ✅ Import Routes
const authRoutes = require("./routes/auth.routes");
const healthRoutes = require("./routes/health.routes");
setupSwagger(app);

// ✅ Use Routes
app.use("/api/auth", authRoutes);
app.use("/heartbeat/health-check", healthRoutes);

// ✅ 404 Handler
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.originalUrl}`);
  res.status(404).json({ success: false, message: "Resource not found." });
});

// ✅ Error Handling Middleware (For Unexpected Errors)
app.use((err, req, res, next) => {
  logger.errorLog.error(`Unexpected Error: ${err.message}`);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

module.exports = app;
