const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET = "greatnessinitspurestform";

exports.postSignup = async (req, res, next) => {
  const { email, username, password } = req.body;

  try {
    // Checking if the email and username already exist
    // Will throw contraint error if it isnt unique
    const checkEmail = await User.findAll({
      where: {
        email: email,
      },
    });
    const checkUsername = await User.findAll({
      where: {
        username: username,
      },
    });

    if (checkEmail.length !== 0) {
      throw new Error("Email Already Exist");
    }
    if (checkUsername.length !== 0) {
      throw new Error("Username Already Exist");
    }
    // encrypt password and store it in database
    const encryptPass = await bcrypt.hash(password, 12);
    await User.create({
      email: email,
      username: username,
      password: encryptPass,
    });
    return res.status(201).json({ message: "User Succesfully Created!" });
  } catch (error) {
    const err = new Error(error.message);
    err.status = 500;
    next(err);
  }
};

exports.postLogin = async (req, res, next) => {
  const { username, password } = req.body;
  try {
    // find user in database
    const [user] = await User.findAll({
      where: {
        username: username,
      },
    });

    // if the user exist try to decrypt password
    if (user !== undefined) {
      // tries to decrypt to password
      const decryptPass = await bcrypt.compare(password, user.password);
      // if the decrypted password is correct then return token
      if (decryptPass) {
        const token = jwt.sign(
          { username: user.username, userId: user.id.toString() },
          SECRET,
          { expiresIn: "1h" }
        );
        return res.status(200).json({ token: token, username: user.username });
      } else {
        throw new Error("Wrong Password!");
      }
    } else {
      throw new Error("User doesn't exist!");
    }
  } catch (error) {
    const err = new Error(error.message);
    err.status = 401;
    next(err);
  }
};
exports.patchLogin = (req, res, next) => {};
exports.deleteLogin = async (req, res, next) => {
  const id = req.userId;
  try {
    await User.destroy({ where: { id: id } });
  } catch (error) {
    console.log(error);
  }
};
