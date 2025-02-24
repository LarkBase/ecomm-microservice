const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimiter = require("./middleware/rateLimit");
const logger = require("./utils/logger");
const authRoutes = require("./routes/auth.routes"); // ✅ Now uses Axios
const productRoutes = require("./routes/product.routes");
const orderRoutes = require("./routes/order.routes");
const userRoutes = require("./routes/user.routes");
const healthRoutes = require("./routes/health.routes");
const { PORT } = require("./config/config");

const app = express();

// ✅ Middleware
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(cors({ origin: "*", credentials: true }));
app.use(rateLimiter);

app.use((req, res, next) => {
  logger.info(`➡️ Incoming Request: ${req.method} ${req.originalUrl}`);
  next();
});

// ✅ API Routes (Forwarding to Services)
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/heartbeat", healthRoutes);

// ✅ Start Server
app.listen(PORT, () => {
  logger.info(`🚀 API Gateway running on port ${PORT}`);
});
