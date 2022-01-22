const Sequelize = require("sequelize");

const sequelize = new Sequelize("dbname", "user", "pass", {
  dialect: "mysql",
  host: "localhost",
});

module.exports = sequelize;
