const Anime = require("../models/anime");
const Watching = require("../models/watching");
const PlanToWatch = require("../models/plantowatch");
const Rating = require("../models/rating");

const ANIMES_PER_PAGES = 7;

/* Watching List Controllers*/
exports.getWatching = async (req, res, next) => {
  const userId = req.userId;
  const page = req.params.pg;
  const watchingAnimes = [];

  try {
    // Query Watch List of the User
    // Limiting each query to 7
    // Offsetting by the page number
    const watching = await Watching.findAll({
      where: {
        userId: userId,
      },
      limit: ANIMES_PER_PAGES,
      offset: page === 1 ? 0 : ANIMES_PER_PAGES * page,
    });

    // If it is empty then return success
    if (watching.length === 0) {
      return res.status(200).json({ watching: [], pages: 0 });
    }
    // Get the total of all of their animes on their watch list
    const count = await Watching.count({
      where: {
        userId: userId,
      },
    });

    // Query the actual animes with the data
    for (let watch of watching) {
      // Query the anime from each watching id
      const [anime] = await Anime.findAll({
        where: {
          watchingId: watch.id,
        },
      });
      // Take the information we need
      const info = {
        name: anime.name,
        imageUrl: anime.imageUrl,
      };
      // Place it into end array
      watchingAnimes.push(info);
    }

    // return data
    res.status(200).json({
      watching: watchingAnimes,
      pages: Math.round(count / ANIMES_PER_PAGES),
    });
  } catch (err) {
    const error = new Error(err.message);
    error.status = 500;
    next(error);
  }
};
exports.postWatching = async (req, res, next) => {
  const userId = req.userId;
  const anime = req.body;

  try {
    // Queries all of the Watching based on the user
    const watching = await Watching.findAll({
      where: {
        userId: userId,
      },
    });
    // Adds the anime and watching row immediately if watching is empty
    if (watching.length === 0) {
      const date = new Date();
      const watchAdded = await Watching.create({
        monthAdded: date.getMonth(),
        userId:userId
      });
      await Anime.create({ ...anime, watchingId: watchAdded.id });
      return res.status(200).json({ message: "Anime Added to Watch List!" });
    }

    // Checks if this anime is a duplicate
    for (let watch of watching) {
      const [animeFound] = await Anime.findAll({
        where: { watchingId: watch.id },
      });
      if (anime.name === animeFound.name) {
        throw new Error("Anime already exist!");
      }
    }

    // Creates watching and anime row
    const date = new Date();
    const watchAdded = await Watching.create({
      monthAdded: date.getMonth(),
      userId: userId,
    });
    await Anime.create({ ...anime, watchingId: watchAdded.id });

    // return success and data
    return res.status(200).json({ message: "Anime Added to Watch List!" });
  } catch (error) {
    next(error);
  }
};
exports.deleteWatching = async (req, res, next) => {
  const userId = req.userId;
  const { name } = req.body.anime;

  try {
    // Queries all watching based on user
    const watching = await Watching.findAll({ where: { userId: userId } });
    // Iterate to find the correct anime that needs to be deleted
    for (let watch of watching) {
      const [anime] = await Anime.findAll({ where: { watchingId: watch.id } });
      if (anime.name === name) {
        await Anime.destroy({ where: { watchingId: watch.id, name: name } });
        await Watching.destroy({ where: { userId: userId, id: watch.id } });
        return res.status(200).json({ message: "Anime Successfully Deleted!" });
      }
    }
  } catch (err) {
    next(err);
  }
};
/* Plan to Watch List Controllers */
exports.getPlanToWatch = async (req, res, next) => {
  const userId = req.userId;
  const page = req.params.pg;
  const planAnimes = [];

  try {
    // Query Plan To Watch List of the User
    // Limiting each query to 7
    // Offsetting by the page number
    const plantowatch = await PlanToWatch.findAll({
      where: {
        userId: userId,
      },
      limit: ANIMES_PER_PAGES,
      offset: page === 1 ? 0 : ANIMES_PER_PAGES * page,
    });

    // If it is empty then return success
    if (plantowatch.length === 0) {
      return res.status(200).json({ plantowatch: [], pages: 0 });
    }
    // Get the total of all of their animes on their watch list
    const count = await PlanToWatch.count({
      where: {
        userId: userId,
      },
    });

    // Query the actual animes with the data
    for (let plan of plantowatch) {
      // Query the anime from each watching id
      const [anime] = await Anime.findAll({
        where: {
          planToWatchId: plan.id,
        },
      });
      // Take the information we need
      const info = {
        name: anime.name,
        imageUrl: anime.imageUrl,
      };
      // Place it into end array
      planAnimes.push(info);
    }

    // return data
    res.status(200).json({
      plantowatch: planAnimes,
      pages: Math.round(count / ANIMES_PER_PAGES),
    });
  } catch (err) {
    const error = new Error(err.message);
    error.status = 500;
    next(error);
  }
};
exports.postPlanToWatch = async (req, res, next) => {
  const userId = req.userId;
  const anime = req.body;

  try {
    // Queries all of the Watching based on the user
    const plantowatch = await PlanToWatch.findAll({
      where: {
        userId: userId,
      },
    });
    // Adds the anime and watching row immediately if watching is empty
    if (plantowatch.length === 0) {
      const date = new Date();
      const planAdded = await PlanToWatch.create({
        monthAdded: date.getMonth(),
        userId: userId,
      });
      await Anime.create({ ...anime, planToWatchId: planAdded.id });
      return res
        .status(200)
        .json({ message: "Anime Added to Plan To Watch List!" });
    }

    // Checks if this anime is a duplicate
    for (let plan of plantowatch) {
      const [animeFound] = await Anime.findAll({
        where: { planToWatchId: plan.id },
      });
      if (anime.name === animeFound.name) {
        throw new Error("Anime already exist!");
      }
    }

    // Creates watching and anime row
    const date = new Date();
    const planAdded = await Watching.create({
      monthAdded: date.getMonth(),
      userId: userId,
    });
    await Anime.create({ ...anime, planToWatchId: planAdded.id });

    // return success and data
    return res
      .status(200)
      .json({ message: "Anime Added to Plan To Watch List!" });
  } catch (error) {
    next(error);
  }
};
exports.deletePlanToWatch = async (req, res, next) => {
  const userId = req.userId;
  const { name } = req.body.anime;

  try {
    // Queries all plan to watch based on user
    const plantowatch = await PlanToWatch.findAll({
      where: { userId: userId },
    });
    // Iterate to find the correct anime that needs to be deleted
    for (let plan of plantowatch) {
      const [anime] = await Anime.findAll({
        where: { planToWatchId: plan.id },
      });
      if (anime.name === name) {
        await Anime.destroy({ where: { planToWatchId: plan.id, name: name } });
        await PlanToWatch.destroy({ where: { userId: userId, id: plan.id } });
        return res.status(200).json({ message: "Anime Successfully Deleted!" });
      }
    }
  } catch (err) {
    next(err);
  }
};

/* Stat Controllers */
exports.getStats = (req, res, next) => {};

/* Rating List Controllers */
exports.getRating = (req, res, next) => {};
exports.postRating = (req, res, next) => {};
exports.patchRating = (req, res, next) => {};
exports.deleteRating = (req, res, next) => {};
