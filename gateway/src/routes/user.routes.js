const express = require("express");
const { userServiceProxy } = require("../middleware/proxyMiddleware");
const router = express.Router();

router.use("/", userServiceProxy);

module.exports = router;
