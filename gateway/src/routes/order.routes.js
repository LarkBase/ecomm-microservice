const express = require("express");
const { orderServiceProxy } = require("../middleware/proxyMiddleware");
const router = express.Router();

router.use("/", orderServiceProxy);

module.exports = router;
