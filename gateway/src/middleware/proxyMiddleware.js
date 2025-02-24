const { createProxyMiddleware } = require("http-proxy-middleware");
const logger = require("../utils/logger");
const config = require("../config/config"); // ✅ Import centralized config

// ✅ Log Proxy Requests
// ✅ Log Proxy Requests
const logProxyRequest = (proxyReq, req) => {
    console.log(`🔁 Proxying request to: ${proxyReq.getHeader("host")}${req.url}`);
    logger.info(`🔁 Proxying request: ${req.method} ${req.originalUrl}`);

    // ✅ Debug: Log request body for POST requests
    if (req.method === "POST" && req.body) {
        console.log("📦 Forwarding Request Body to Auth Service:", req.body);
        try {
            let bodyData = JSON.stringify(req.body);
            proxyReq.setHeader("Content-Type", "application/json");
            proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        } catch (err) {
            console.error("❌ Error forwarding body:", err);
        }
    }
};
  // ✅ Log Proxy Errors
  const logProxyError = (err, req, res) => {
    console.error(`❌ Proxy error: ${err.message} | ${req.method} ${req.originalUrl}`);
    logger.error(`❌ Proxy error: ${err.message} | ${req.method} ${req.originalUrl}`);
    res.status(500).json({ success: false, message: "Proxy error occurred" });
  };
 
exports.authServiceProxy = createProxyMiddleware({
    target: config.AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/auth": "/api/auth" },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`🔁 Proxying request to: ${proxyReq.getHeader("host")}${req.url}`);
        logger.info(`🔁 Proxying request: ${req.method} ${req.originalUrl}`);

        // ✅ Debug: Log request body for POST requests
        if (req.method === "POST" && req.body) {
            console.log("📦 Request Body:", req.body);
        }
    },
    onError: logProxyError,
});

  
  // ✅ Auth Service Proxy
  exports.authHealthServiceProxy = createProxyMiddleware({
    target: config.AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {}, 
});
  

exports.productServiceProxy = createProxyMiddleware({
  target: config.PRODUCT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { "^/api/products": "" },
  onProxyReq: logProxyRequest,
  onError: logProxyError,
});

exports.orderServiceProxy = createProxyMiddleware({
  target: config.ORDER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { "^/api/orders": "" },
  onProxyReq: logProxyRequest,
  onError: logProxyError,
});

exports.userServiceProxy = createProxyMiddleware({
  target: config.USER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { "^/api/users": "" },
  onProxyReq: logProxyRequest,
  onError: logProxyError,
});
