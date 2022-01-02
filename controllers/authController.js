const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET = require("../protection/checkJWT").SECRET;
const { validationResult } = require("express-validator");
const Cryptor = require("fine-crypt");
const cryptor = new Cryptor(SECRET);

const sendGridKey =
  "key";
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(sendGridKey);

exports.postSignup = async (req, res, next) => {
  const { email, username, password } = req.body;
  const errors = validationResult(req);

  try {
    if (!errors.isEmpty()) {
      if (errors.array()[0].param === "email") {
        throw new Error("You need a valid email!");
      }
      if (errors.array()[0].param === "username") {
        throw new Error("Username has to be 3 characters or more!");
      }
      if (errors.array()[0].param === "password") {
        throw new Error("Password has to be 6 characters or more!");
      }
    }

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
  const errors = validationResult(req);

  try {
    if (!errors.isEmpty()) {
      if (errors.array()[0].param === "username") {
        throw new Error("Username has to be 3 characters or more!");
      }
      if (errors.array()[0].param === "password") {
        throw new Error("Password has to be 6 characters or more!");
      }
    }
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
exports.patchReset = async (req, res, next) => {
  const token = req.params.token;
  const { password } = req.body;
  const errors = validationResult(req);

  try {
    if (!errors.isEmpty()) {
      if (errors.array()[0].param === "password") {
        throw new Error("Password has to be 6 characters or more!");
      }
    }

    const userId = cryptor.decrypt(token).split("=")[1];
    const user = await User.findOne({ where: { id: userId } });
    if (user === null) {
      throw new Error("User doesn't Exist!");
    }
    if (
      user.hasForgotPassword === null ||
      user.forgotPasswordExpired.getTime() < new Date().getTime()
    ) {
      const err = new Error("User not Authenicated!");
      err.status = 401;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
    user.hasForgotPassword = null;
    user.forgotPasswordExpired = null;
    user.save();

    return res.status(200);
  } catch (err) {
    next(err);
  }
};
exports.deleteLogin = async (req, res, next) => {
  const id = req.userId;
  try {
    await User.destroy({ where: { id: id } });
  } catch (error) {
    console.log(error);
  }
};

exports.postRecovery = async (req, res, next) => {
  const { email } = req.body;
  const errors = validationResult(req);
  const msg = {
    to: email, // Change to your recipient
    from: "animeanalyticsmessager@gmail.com", // Change to your verified sender
    subject: "Resetting your Password",
  };

  try {
    if (!errors.isEmpty()) {
      throw new Error("You need to enter a valid email!");
    }

    const user = await User.findOne({ where: { email: email } });
    if (user === null) {
      throw new Error("This email doesn't exist!");
    }
    const date = new Date();
    date.setHours(date.getHours() + 1);

    user.hasForgotPassword = true;
    user.forgotPasswordExpired = date;
    user.save();

    const hashedId = cryptor.encrypt(SECRET + "=" + String(user.id));
    const url = `http://localhost:3000/recovery/${hashedId}`;
    msg.html = `
    <h2>Reset Your Password Below!</h2></br>
    <a href=${url}>Click here to Reset Password!</a> </br>
    <p>You only have 1 hour to reset your password </p>
    `;

    await sgMail.send(msg);
    return res.status(200);
  } catch (error) {
    next(error);
  }
};
