const winston = require("winston");
require("winston-daily-rotate-file");
const path = require("path");

// ✅ Define log directory
const logDir = path.join(__dirname, "../../logs");

// ✅ Create a rotating file transport for error logs
const errorTransport = new winston.transports.DailyRotateFile({
  filename: `${logDir}/error-%DATE%.log`,
  datePattern: "YYYY-MM-DD",
  zippedArchive: true, // ✅ Compress old logs
  maxSize: "50m", // ✅ 50MB per file
  maxFiles: "14d", // ✅ Retain logs for 14 days
  level: "error",
});

// ✅ Create a rotating file transport for all logs
const combinedTransport = new winston.transports.DailyRotateFile({
  filename: `${logDir}/combined-%DATE%.log`,
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "50m",
  maxFiles: "14d",
});

// ✅ Create the Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    errorTransport,
    combinedTransport,
  ],
});

// ✅ Handle uncaught exceptions & rejections
logger.exceptions.handle(
  new winston.transports.File({ filename: `${logDir}/exceptions.log` })
);

logger.rejections.handle(
  new winston.transports.File({ filename: `${logDir}/rejections.log` })
);

module.exports = logger;
