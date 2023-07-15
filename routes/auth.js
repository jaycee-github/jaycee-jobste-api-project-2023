const express = require("express");
const router = express.Router();
const authenticateUser = require("../middleware/authentication.js");
const testUser = require("../middleware/testUser.js");

const rateLimiter = require("express-rate-limit");
const apiLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
        msg: "Too many requests from this IP. Please try again after 15 minutes.",
    },
});

const { login, register, updateUser } = require("../controllers/auth.js");

router.post("/register", apiLimiter, register);
router.post("/login", apiLimiter, login);
router.patch("/updateUser", authenticateUser, testUser, updateUser);

module.exports = router;
