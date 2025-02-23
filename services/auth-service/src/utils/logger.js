const winston = require("winston");
require("winston-daily-rotate-file");
const path = require("path");

// ✅ Define log directory
const logDir = path.join(__dirname, "../../logs");

// ✅ Create rotating file transports
const transports = {
  combined: new winston.transports.DailyRotateFile({
    filename: `${logDir}/combined-%DATE%.log`,
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "50m",
    maxFiles: "14d",
  }),

  error: new winston.transports.DailyRotateFile({
    filename: `${logDir}/error-%DATE%.log`,
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "50m",
    maxFiles: "14d",
    level: "error",
  }),

  auth: new winston.transports.DailyRotateFile({
    filename: `${logDir}/auth-%DATE%.log`,
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "50m",
    maxFiles: "14d",
  }),

  audit: new winston.transports.DailyRotateFile({
    filename: `${logDir}/audit-%DATE%.log`,
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "50m",
    maxFiles: "30d",
  }),

  console: new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
};

// ✅ Main Logger Instance
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.json()
  ),
  transports: [
    transports.combined,
    transports.error,
    transports.auth, // ✅ Now Auth Logs will be written in main logs too
    transports.audit, // ✅ Now Audit Logs will be written in main logs too
    transports.console,
  ],
});

// ✅ Specific Loggers for Different Use Cases
logger.auth = logger.child({ level: "info", defaultMeta: { category: "Auth" } });
logger.audit = logger.child({ level: "info", defaultMeta: { category: "Audit" } });
logger.errorLog = logger.child({ level: "error", defaultMeta: { category: "Error" } });

// ✅ Handle Uncaught Exceptions & Unhandled Rejections
logger.exceptions.handle(
  new winston.transports.File({ filename: `${logDir}/exceptions.log` })
);
logger.rejections.handle(
  new winston.transports.File({ filename: `${logDir}/rejections.log` })
);

module.exports = logger;
