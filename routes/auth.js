const express = require("express");

const router = express.Router();

const auth = require("../controllers/authController");

// POST => Create a User
router.post("/signup", auth.postSignup);


// POST => Login User
router.post("/login", auth.postLogin);
// PATCH => Update User
router.patch("/login", auth.patchLogin);
// DELETE => Delete User
router.delete("/login", auth.deleteLogin);

module.exports = router;
