const express = require("express");
const { body } = require("express-validator");

const router = express.Router();

const auth = require("../controllers/authController");

// POST => Create a User
router.post(
  "/signup",
  body("email").isEmail(),
  body("username").isLength({ min: 3 }),
  body("password").isLength({ min: 6 }),
  auth.postSignup
);

// POST => Login User
router.post(
  "/login",
  body("username").isLength({ min: 3 }),
  body("password").isLength({ min: 6 }),
  auth.postLogin
);

// PATCH => Update User
router.patch(
  "/reset/:token",
  body("password").isLength({ min: 6 }),
  auth.patchReset
);
// DELETE => Delete User
router.delete("/login", auth.deleteLogin);

router.post("/recovery", auth.postRecovery);

module.exports = router;
