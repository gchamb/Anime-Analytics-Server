const Sequelize = require("sequelize");
const sequelize = require("../utils/database");

const Rating = sequelize.define("rating", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  rate: { type: Sequelize.INTEGER, allowNull: false },
  monthAdded: { type: Sequelize.INTEGER, allowNull: false },
});

module.exports = Rating;
