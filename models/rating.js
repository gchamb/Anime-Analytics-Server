const Sequelize = require("sequelize");
const sequelize = require("../utils/database");

const Rating = sequelize.define("rating", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  name: { type: Sequelize.STRING, allowNull: false },
  monthAdded: { type: Sequelize.STRING, allowNull: false },
  rate: { type: Sequelize.INTEGER, allowNull: false },
});

module.exports = Rating;
