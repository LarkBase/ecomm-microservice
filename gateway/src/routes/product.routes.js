const express = require("express");
const axios = require("axios");
const logger = require("../utils/logger");
const config = require("../config/config");

const router = express.Router();
const PRODUCT_SERVICE_URL = config.PRODUCT_SERVICE_URL;

router.all("/*", async (req, res) => {
  try {
    logger.info(`➡️ Forwarding request to Product Service: ${req.method} ${PRODUCT_SERVICE_URL}${req.originalUrl}`);

    const response = await axios({
      method: req.method,
      url: `${PRODUCT_SERVICE_URL}${req.originalUrl}`,
      data: req.body,
      headers: { ...req.headers },
    });

    logger.info(`✅ Response from Product Service: ${response.status} ${req.originalUrl}`);

    res.status(response.status).json(response.data);
  } catch (error) {
    logger.error(`❌ Error Proxying to Product Service: ${error.message}`);

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    res.status(500).json({ success: false, message: "API Gateway Proxy Error" });
  }
});

module.exports = router;
