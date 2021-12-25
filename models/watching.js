const Sequelize = require("sequelize");
const sequelize = require("../utils/database");

const Watching = sequelize.define("watching", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  monthAdded: { type: Sequelize.INTEGER, allowNull: false },
});

module.exports = Watching;
