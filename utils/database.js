const Sequelize = require("sequelize");

const sequelize = new Sequelize("db", "user", "pass", {
  dialect: "mysql",
  host: "localhost",
});

module.exports = sequelize;
