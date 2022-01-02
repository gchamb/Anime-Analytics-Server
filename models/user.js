const Sequelize = require("sequelize");
const sequelize = require("../utils/database");

const User = sequelize.define("user", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  email: { type: Sequelize.STRING, allowNull: false, unique: true },
  username: { type: Sequelize.STRING, allowNull: false, unique: true },
  password: { type: Sequelize.STRING, allowNull: false },
  hasToken: { type: Sequelize.BOOLEAN, allowNull: true },
  tokenExpired: { type: Sequelize.DATE, allowNull: true },
  hasForgotPassword: { type: Sequelize.BOOLEAN, allowNull: true },
  forgotPasswordExpired: { type: Sequelize.DATE, allowNull: true },
});

module.exports = User;
