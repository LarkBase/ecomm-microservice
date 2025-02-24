const express = require("express");
const axios = require("axios");
const logger = require("../utils/logger");
const config = require("../config/config");

const router = express.Router();
const AUTH_SERVICE_URL = config.AUTH_SERVICE_URL;

// ✅ Forward all requests to Auth Service
router.all("/*", async (req, res) => {
  try {
    logger.info(`🔁 Proxying request to Auth Service: ${req.method} ${req.originalUrl}`);

    // ✅ Forward request to Auth Service using Axios
    const response = await axios({
      method: req.method,
      url: `${AUTH_SERVICE_URL}${req.originalUrl}`, 
      data: req.body,
      headers: {
        "Content-Type": "application/json", 
      },
    });

    logger.info(`✅ Response from Auth Service: ${response.status} ${req.originalUrl}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    logger.error(`❌ Proxy error: ${error.message} | ${req.method} ${req.originalUrl}`);

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    res.status(500).json({ success: false, message: "API Gateway Proxy Error" });
  }
});

module.exports = router;
