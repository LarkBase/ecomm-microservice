const jwt = require("jsonwebtoken");

exports.authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized access. No token provided." });
  }

  jwt.verify(token, process.env.JWT_SECRET || "default_secret", (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Invalid or expired token." });
    }

    req.user = user;
    next();
  });
};
