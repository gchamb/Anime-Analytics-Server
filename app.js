const express = require("express");
const sequelize = require("./utils/database");
const parser = require("body-parser");
const cors = require("cors");
const redis = require("./utils/redis");

const activityRoutes = require("./routes/activity");
const authRoutes = require("./routes/auth");
const jikanRoutes = require("./routes/jikan");

const User = require("./models/user");
const Anime = require("./models/anime");
const Watching = require("./models/watching");
const PlanToWatch = require("./models/plantowatch");
const Rating = require("./models/rating");

const app = express();

app.use(parser.json());
app.use(parser.urlencoded({ extended: false }));
app.use(cors());

app.use(jikanRoutes);
app.use(authRoutes);
app.use(activityRoutes);
app.use((err, req, res, next) => {
  if (err.status === undefined) {
    console.log(err.message);
    err.status = 500;
  }
  return res.status(err.status).json({ error: err.message });
});

Anime.belongsTo(Watching, {
  constraints: true,
  onDelete: "CASCADE",
  foreignKey: { allowNull: true },
});
Anime.belongsTo(PlanToWatch, {
  constraints: true,
  onDelete: "CASCADE",
  foreignKey: { allowNull: true },
});
Anime.belongsTo(Rating, {
  constraints: true,
  onDelete: "CASCADE",
  foreignKey: { allowNull: true },
});
Watching.belongsTo(User, { constraints: true, onDelete: "CASCADE" });
PlanToWatch.belongsTo(User, { constraints: true, onDelete: "CASCADE" });
Rating.belongsTo(User, { constraints: true, onDelete: "CASCADE" });

sequelize
  .sync()
  .then(() => {
    return redis.connect();
  })
  .then(() => {
    app.listen(5000 || process.env.PORT);
  })
  .catch((err) => console.log(err));
