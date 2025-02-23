const http = require("http");
const app = require("./app");
const { PORT } = require("./config/config");
const logger = require("./utils/logger");

const server = http.createServer(app);

server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});
