const Sequelize = require("sequelize");
const sequelize = require("../utils/database");

const PlanToWatch = sequelize.define("planToWatch", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  monthAdded: { type: Sequelize.STRING, allowNull: false },
  
});

module.exports = PlanToWatch;
