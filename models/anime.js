const Sequelize = require("sequelize").DataTypes;
const sequelize = require("../utils/database");

const Anime = sequelize.define(
  "anime",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: { type: Sequelize.STRING, allowNull: false },
    genres: {
      type: Sequelize.JSON,
    },
    episodes: { type: Sequelize.INTEGER, allowNull: false },
    yearReleased: { type: Sequelize.INTEGER, allowNull: false },
    studio: { type: Sequelize.STRING, allowNull: false },
    imageUrl: { type: Sequelize.STRING, allowNull: false },
  },
  {
    createdAt: false,
    updatedAt: false,
  }
);

module.exports = Anime;
