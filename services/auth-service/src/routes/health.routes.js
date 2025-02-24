const express = require("express");
const { basicHealthCheck, detailedHealthCheck } = require("../controllers/health.controller");

const router = express.Router();

// ✅ Basic Health Check (Just server status)
router.get("/", basicHealthCheck);

// ✅ Detailed Health Check (Includes DB & Other Services)
router.get("/details", detailedHealthCheck);

module.exports = router;
