require("dotenv").config();

module.exports = {
  // ✅ API Gateway Configuration
  PORT: process.env.PORT ,
  APP_BASE_URL: process.env.APP_BASE_URL ,

  // ✅ Microservices URLs
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL,
  PRODUCT_SERVICE_URL: process.env.PRODUCT_SERVICE_URL ,
  ORDER_SERVICE_URL: process.env.ORDER_SERVICE_URL ,
  USER_SERVICE_URL: process.env.USER_SERVICE_URL ,

  // ✅ JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY ,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ,
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY ,

  // ✅ Bcrypt Configuration
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS),

  // ✅ Rate Limiting
  RATE_LIMIT: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) ,
    max: parseInt(process.env.RATE_LIMIT_MAX),
  },
};
