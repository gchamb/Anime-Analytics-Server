const Sequelize = require("sequelize");

const sequelize = new Sequelize("tracker", "root", "Tc071643", {
  dialect: "mysql",
  host: "localhost",
});

module.exports = sequelize;
