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
  month: { type: Sequelize.INTEGER, allowNull: false },
  day: { type: Sequelize.INTEGER, allowNull: false },
  year: { type: Sequelize.INTEGER, allowNull: false },
});

module.exports = Rating;
