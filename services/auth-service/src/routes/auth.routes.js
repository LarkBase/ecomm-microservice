const express = require("express");
const {
    register,
    login,
    refreshToken,
    forgotPassword,
    resetPassword,
    logout,
  } = require("../controllers/auth.controller");
  
const {
    validateRegister,
    validateLogin,
    validateForgotPassword,
    validateResetPassword,
  } = require("../validations");


const router = express.Router();

// ✅ Routes
router.post("/register", validateRegister, register);
router.post('/refresh-token', refreshToken);
router.post("/login",validateLogin, login);
router.post("/forgot-password", validateForgotPassword, forgotPassword);
router.post("/reset-password", validateResetPassword, resetPassword);
router.post("/logout", logout);

module.exports = router;
