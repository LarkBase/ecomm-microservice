const swaggerUi = require("swagger-ui-express");
const yaml = require("yamljs");
const path = require("path");

// Load YAML file
const swaggerDocument = yaml.load(path.join(__dirname, "swagger.yaml"));

const setupSwagger = (app) => {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: false }));
};

module.exports = setupSwagger;
