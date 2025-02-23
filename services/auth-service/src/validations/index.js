const validateRegister = require("./register.validation");
const validateLogin = require("./login.validation");
const validateForgotPassword = require("./forgot-password.validation");
const validateResetPassword = require("./reset-password.validation");

module.exports = {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
};
