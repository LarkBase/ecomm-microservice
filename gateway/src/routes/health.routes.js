const express = require("express");
const axios = require("axios");
const logger = require("../utils/logger");
const config = require("../config/config");

const router = express.Router();

const AUTH_SERVICE_URL = config.AUTH_SERVICE_URL;

// ✅ Forward requests to Auth Service using Axios
router.all("/*", async (req, res) => {
  try {
    logger.info(`➡️ Forwarding request to Auth Service: ${req.method} ${AUTH_SERVICE_URL}${req.originalUrl}`);

    // ✅ Explicitly log request body
    if (req.method !== "GET") {
        console.log("📦 Forwarding Request Body:", req.body);
    }

      
    // ✅ Send request to Auth Service
    const response = await axios({
      method: req.method,
      url: `${AUTH_SERVICE_URL}${req.originalUrl}`, // Preserve the original path
      data: req.body, // Forward request body
      headers: { ...req.headers }, // Forward headers
    });

    logger.info(`✅ Response from Auth Service: ${response.status} ${req.originalUrl}`);

    res.status(response.status).json(response.data);
  } catch (error) {
    logger.error(`❌ Error Proxying to Auth Service: ${error.message}`);

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    res.status(500).json({ success: false, message: "API Gateway Proxy Error" });
  }
});

module.exports = router;