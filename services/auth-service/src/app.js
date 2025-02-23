const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { RATE_LIMIT } = require("./config/config");
const logger = require("./utils/logger");
const cookieParser = require('cookie-parser');
const setupSwagger = require("./config/swaggerConfig");

const app = express();

// ✅ Middleware
app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded requests
app.use(
    cors({
      origin: "*", // Allow all origins
      credentials: true, // Allow cookies
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  );
app.use(helmet()); // Security headers
app.use(morgan("combined")); // Enhanced logging
app.use(cookieParser()); 

// ✅ Rate Limiting - Prevent brute force attacks
const limiter = rateLimit({
  windowMs: RATE_LIMIT.windowMs,
  max: RATE_LIMIT.max,
  message: "Too many requests, please try again later.",
});
app.use(limiter);

// ✅ Import Routes
const authRoutes = require("./routes/auth.routes");
setupSwagger(app);

// ✅ Use Routes
app.use("/api/auth", authRoutes);



// ✅ 404 Handler
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.originalUrl}`);
  res.status(404).json({ success: false, message: "Resource not found." });
});

module.exports = app;
