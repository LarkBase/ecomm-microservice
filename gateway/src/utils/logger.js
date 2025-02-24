const winston = require("winston");
const path = require("path");

// ✅ Define log directory
const logDir = path.join("logs");

// ✅ Create rotating file transports
const transports = {
  combined: new winston.transports.File({ filename: `${logDir}/gateway.log` }),
  error: new winston.transports.File({ filename: `${logDir}/error.log`, level: "error" }),
  console: new winston.transports.Console(),
};

// ✅ Main Logger Instance
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [transports.combined, transports.error, transports.console],
});

module.exports = logger;
