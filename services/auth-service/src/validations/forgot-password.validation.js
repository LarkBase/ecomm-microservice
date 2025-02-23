const { body, validationResult } = require("express-validator");

const validateForgotPassword = [
  body("email").isEmail().withMessage("Invalid email format").normalizeEmail(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation error", errors: errors.array() });
    }
    next();
  },
];

module.exports = validateForgotPassword;
