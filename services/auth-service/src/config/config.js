require('dotenv').config();

// Determine the database URL based on NODE_ENV
let DATABASE_URL;
switch (process.env.NODE_ENV) {
  case 'DEVELOPMENT':
    DATABASE_URL = process.env.DATABASE_URL;
    break;
  case 'test':
    DATABASE_URL = process.env.DATABASE_URL_TEST;
    break;
  case 'UAT':
    DATABASE_URL = process.env.DATABASE_URL_UAT;
    break;
  default:
    throw new Error(`Unsupported NODE_ENV: ${process.env.NODE_ENV}`);
}

module.exports = {
  PORT: process.env.PORT,
  DATABASE_URL, // Use the dynamically selected database URL
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY,
  APP_BASE_URL: process.env.APP_BASE_URL,
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10),
  RATE_LIMIT: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10), // Ensure it's a number
    max: parseInt(process.env.RATE_LIMIT_MAX, 10), // Ensure it's a number
  },
  EMAIL_CONFIG: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10), // Ensure it's a number
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    from: process.env.SMTP_FROM,
  },
};