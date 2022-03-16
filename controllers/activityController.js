const Anime = require("../models/anime");
const User = require("../models/user");
const Watching = require("../models/watching");
const PlanToWatch = require("../models/plantowatch");
const Rating = require("../models/rating");
const SECRET = require("../protection/checkJWT").SECRET;
const Cryptor = require("fine-crypt");
const cryptor = new Cryptor(SECRET);

const ANIMES_PER_PAGES = 7;

exports.getOverview = async (req, res, next) => {
  const userId = req.userId;
  const overViewLimit = 4;
  const overview = {
    watch: [],
    plan: [],
    rating: [],
    stats: {
      bar: {
        // Animes watched based on rating
        animesPerStar: {
          0: 0,
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        // Animes watched in a certain month
        animesPerMonth: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
          6: 0,
          7: 0,
          8: 0,
          9: 0,
          10: 0,
          11: 0,
          12: 0,
        },
        // Animes released in a certain based off what you watched
        animesPerRelease: {},
      },
    },
  };
  try {
    const watching = await Watching.findAll({
      where: { userId: userId },
      limit: overViewLimit,
    });

    if (watching.length !== 0) {
      // Query the actual animes with the data
      for (let watch of watching) {
        // Query the anime from each watching id
        const [anime] = await Anime.findAll({
          where: {
            watchingId: watch.id,
          },
        });
        if (anime === undefined) {
          continue;
        } else {
          // Take the information we need
          const info = {
            name: anime.name,
            imageUrl: anime.imageUrl,
          };
          // Place it into end array
          overview.watch.push(info);
        }
      }
    }

    const plantowatch = await PlanToWatch.findAll({
      where: { userId: userId },
      limit: overViewLimit,
    });

    // Query the actual animes with the data
    for (let plan of plantowatch) {
      // Query the anime from each watching id
      const [anime] = await Anime.findAll({
        where: {
          planToWatchId: plan.id,
        },
      });
      if (anime === undefined) {
        continue;
      } else {
        // Take the information we need
        const info = {
          name: anime.name,
          imageUrl: anime.imageUrl,
        };
        // Place it into end array
        overview.plan.push(info);
      }
    }

    const ratings = await Rating.findAll({
      where: { userId: userId },
      limit: overViewLimit,
    });

    if (ratings.length !== 0) {
      // Query the actual animes with the data
      for (let rate of ratings) {
        // Query the anime from each watching id
        const [anime] = await Anime.findAll({
          where: {
            ratingId: rate.id,
          },
        });

        if (anime === undefined) {
          continue;
        } else {
          // Take the information we need
          const info = {
            name: anime.name,
            rate: rate.rate,
            imageUrl: anime.imageUrl,
          };
          // Place it into end array
          overview.rating.push(info);
        }

        //Stats Overview
        overview.stats.bar.animesPerStar[rate.rate] += 1;
        overview.stats.bar.animesPerMonth[rate.month] += 1;

        const currentYearReleased = anime.yearReleased;
        if (currentYearReleased === null) {
          continue;
        } else if (currentYearReleased in overview.stats.bar.animesPerRelease) {
          overview.stats.bar.animesPerRelease[currentYearReleased] += 1;
        } else {
          overview.stats.bar.animesPerRelease[currentYearReleased] = 1;
        }
      }
    }

    return res.status(200).json(overview);
  } catch (error) {
    next(error);
  }
};

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
      offset: (page - 1) * ANIMES_PER_PAGES,
      limit: ANIMES_PER_PAGES,
      subQuery: false,
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
      if (anime === undefined) {
        continue;
      } else {
        // Take the information we need
        const info = {
          name: anime.name,
          genres: anime.genres,
          episodes: anime.episodes,
          yearReleased: anime.yearReleased,
          studio: anime.studio,
          imageUrl: anime.imageUrl,
          watchingId: anime.watchingId,
        };
        // Place it into end array
        watchingAnimes.push(info);
      }
    }

    // return data
    res.status(200).json({
      watching: watchingAnimes,
      pages:
        count / ANIMES_PER_PAGES <= 1 ? 1 : Math.ceil(count / ANIMES_PER_PAGES),
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
        userId: userId,
      });
      await Anime.create({
        ...anime,
        watchingId: watchAdded.id,
        planToWatchId: null,
      });
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
    // Check if this anime is coming from the plan to watch database
    // if so delete from that database and add it to the watching list
    if (anime.planToWatchId) {
      await PlanToWatch.destroy({
        where: { id: anime.planToWatchId },
      });
    }

    // Creates watching and anime row
    const date = new Date();
    const watchAdded = await Watching.create({
      monthAdded: date.getMonth(),
      userId: userId,
    });
    await Anime.create({
      ...anime,
      watchingId: watchAdded.id,
      planToWatchId: null,
    });

    // return success and data
    return res.status(200).json({ message: "Anime Added to Watch List!" });
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};
exports.deleteWatching = async (req, res, next) => {
  const userId = req.userId;
  const watchId = req.params.id;

  try {
    // Delete the specific watch row
    await Watching.destroy({
      where: { userId: userId, id: watchId },
    });
    return res.status(200).json({ message: "Anime Successfully Deleted!" });
  } catch (err) {
    console.log(err.message);
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
      offset: (page - 1) * ANIMES_PER_PAGES,
      subQuery: false,
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
      if (anime === undefined) {
        continue;
      } else {
        // Take the information we need
        const info = {
          name: anime.name,
          genres: anime.genres,
          episodes: anime.episodes,
          yearReleased: anime.yearReleased,
          studio: anime.studio,
          imageUrl: anime.imageUrl,
          planToWatchId: anime.planToWatchId,
        };
        // Place it into end array
        planAnimes.push(info);
      }
    }
    console.log(count / ANIMES_PER_PAGES);
    // return data
    res.status(200).json({
      plantowatch: planAnimes,
      pages:
        count / ANIMES_PER_PAGES <= 1 ? 1 : Math.ceil(count / ANIMES_PER_PAGES),
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

    const watching = await Watching.findAll({
      where: {
        userId: userId,
      },
    });

    // Checking if it is already in watch liST
    if (watching.length > 0) {
      for (let watch of watching) {
        const [animeAlreadyExist] = await Anime.findAll({
          where: { watchingId: watch.id },
        });

        if (animeAlreadyExist.name === anime.name) {
          throw new Error("Anime Already Exist in Watch List");
        }
      }
    }

    // Adds the anime and watching row immediately if watching is empty
    if (plantowatch.length === 0) {
      const date = new Date();
      const planAdded = await PlanToWatch.create({
        monthAdded: date.getMonth(),
        userId: userId,
      });
      await Anime.create({
        ...anime,
        planToWatchId: planAdded.id,
        watchingId: null,
      });
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
    const planAdded = await PlanToWatch.create({
      monthAdded: date.getMonth(),
      userId: userId,
    });
    await Anime.create({
      ...anime,
      planToWatchId: planAdded.id,
      watchingId: null,
    });

    // return success and data
    return res
      .status(200)
      .json({ message: "Anime Added to Plan To Watch List!" });
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};
exports.deletePlanToWatch = async (req, res, next) => {
  const userId = req.userId;
  const planId = req.params.id;

  try {
    // Delete the specific watch row
    await PlanToWatch.destroy({
      where: { userId: userId, id: planId },
    });
    return res.status(200).json({ message: "Anime Successfully Deleted!" });
  } catch (err) {
    console.log(err.message);
    next(err);
  }
};
exports.getShared = async (req, res, next) => {
  const token = req.params.token;
  const page = req.params.pg;
  const ratings = [];

  if (!token) {
    const err = new Error("Not Authenticated");
    err.status = 401;
    next(err);
  }

  try {
    const decode = +cryptor.decrypt(token).split("=")[1];
    const user = await User.findOne({ where: { id: decode } });
    if (!user.hasToken || user.tokenExpired.getTime() < new Date().getTime()) {
      user.hasToken = null;
      user.tokenExpired = null;
      user.save();
      throw new Error("Not Authenicated");
    }
    const rating = await Rating.findAll({
      where: { userId: decode },
      limit: ANIMES_PER_PAGES,
      offset: (page - 1) * ANIMES_PER_PAGES,
      subQuery: false,
    });

    if (rating.length === 0) {
      return res.status(200).json({ ratings: [], pages: 0 });
    }

    const count = await Rating.count({
      where: { userId: decode },
    });

    // Query the actual animes with the data
    for (let rate of rating) {
      // Query the anime from each watching id
      const [anime] = await Anime.findAll({
        where: {
          ratingId: rate.id,
        },
      });

      if (anime === undefined) {
        continue;
      } else {
        // Take the information we need
        const info = {
          name: anime.name,
          rate: rate.rate,
          imageUrl: anime.imageUrl,
          ratingId: anime.ratingId,
        };
        // Place it into end array
        ratings.push(info);
      }
    }

    // return data
    res.status(200).json({
      ratings: ratings,
      pages:
        count / ANIMES_PER_PAGES <= 1
          ? 1
          : Math.round(count / ANIMES_PER_PAGES) + 1,
    });
  } catch (error) {
    next(error);
  }
};
exports.getShare = async (req, res, next) => {
  const userId = req.userId;
  try {
    const user = await User.findOne({ where: { id: userId } });
    user.hasToken = true;
    const date = new Date();
    date.setHours(date.getHours() + 1);
    user.tokenExpired = date;
    user.save();

    const hashedId = cryptor.encrypt(SECRET + "=" + String(userId));
    const url = `http://localhost:3000/share/${hashedId}`;
    return res.status(200).json({ url: url });
  } catch (error) {
    next(error);
  }
};

/* Stat Controllers */
exports.getStats = async (req, res, next) => {
  const userId = req.userId;
  const year = req.params.year;
  const data = {
    bar: {
      // Animes watched based on rating
      animesPerStar: {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
      // Animes watched in a certain month
      animesPerMonth: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
        9: 0,
        10: 0,
        11: 0,
        12: 0,
      },
      // Animes released in a certain based off what you watched
      animesPerRelease: {},
    },
    pie: {
      // Top Anime Genres
      topGenre: {},
      // Top Studios you watched Animes from
      topStudios: {},
    },
    line: {
      // Total Episodes vs Amount of Anime
        episodesPerMonth: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
          6: 0,
          7: 0,
          8: 0,
          9: 0,
          10: 0,
          11: 0,
          12: 0,
        },
   
    },
    radar: {
      topGenre: {},
    },
    years: [],
  };
  try {
    let rating;
    if (year === "null") {
      rating = await Rating.findAll({ where: { userId: userId } });
    } else {
      rating = await Rating.findAll({ where: { userId: userId, year: +year } });
    }

    if (rating.length === 0) {
      return res.status(200).json({ data: "No Data" });
    }

    for (let rate of rating) {
      if (year === "null") {
        if (!data.years.includes(rate.year)) {
          data.years.push(rate.year);
        }
      }

      data.bar.animesPerStar[rate.rate] += 1;
      data.bar.animesPerMonth[rate.month] += 1;

      const [anime] = await Anime.findAll({ where: { ratingId: rate.id } });

      const currentYearReleased = anime.yearReleased;
      if (currentYearReleased === null) {
        continue;
      } else if (currentYearReleased in data.bar.animesPerRelease) {
        data.bar.animesPerRelease[currentYearReleased] += 1;
      } else {
        data.bar.animesPerRelease[currentYearReleased] = 1;
      }

      const currentGenres = anime.genres;
      currentGenres.map((genre) => {
        if (genre in data.pie.topGenre) {
          data.pie.topGenre[genre] += 1;
        } else {
          data.pie.topGenre[genre] = 1;
        }
      });

      const currentStudio = anime.studio;
      if (currentStudio === null) {
        continue;
      } else if (currentStudio in data.pie.topStudios) {
        data.pie.topStudios[currentStudio] += 1;
      } else {
        data.pie.topStudios[currentStudio] = 1;
      }

      const currentEpisodes = anime.episodes;
      data.line.episodesPerMonth[rate.month] +=
        currentEpisodes;
    }
    data.radar.topGenre = { ...data.pie.topGenre };

    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

/* Rating List Controllers */
exports.getRating = async (req, res, next) => {
  const userId = req.userId;
  const page = req.params.pg;
  const ratings = [];

  try {
    const rating = await Rating.findAll({
      where: { userId: userId },
      limit: ANIMES_PER_PAGES,
      offset: (page - 1) * ANIMES_PER_PAGES,
      subQuery: false,
    });

    if (rating.length === 0) {
      return res.status(200).json({ ratings: [], pages: 0 });
    }

    const count = await Rating.count({
      where: { userId: userId },
    });

    // Query the actual animes with the data
    for (let rate of rating) {
      // Query the anime from each watching id
      const [anime] = await Anime.findAll({
        where: {
          ratingId: rate.id,
        },
      });

      if (anime === undefined) {
        continue;
      } else {
        // Take the information we need
        const info = {
          name: anime.name,
          rate: rate.rate,
          imageUrl: anime.imageUrl,
          ratingId: anime.ratingId,
        };
        // Place it into end array
        ratings.push(info);
      }
    }

    // return data
    res.status(200).json({
      ratings: ratings,
      pages:
        count / ANIMES_PER_PAGES <= 1
          ? 1
          : Math.round(count / ANIMES_PER_PAGES) + 1,
    });
  } catch (error) {
    next(error);
  }
};
exports.postRating = async (req, res, next) => {
  const userId = req.userId;
  const anime = req.body;
  const rate = anime.rate;
  const date = anime.date.split("-");
  delete anime.rate;
  delete anime.date;

  try {
    // Queries all of the Watching based on the user
    const rating = await Rating.findAll({
      where: {
        userId: userId,
      },
    });

    // Check if this anime is coming from the plan to watch database
    // if so delete from that database and add it to the watching list
    if (anime.planToWatchId) {
      await PlanToWatch.destroy({
        where: { id: anime.planToWatchId },
      });
    }

    if (anime.watchingId) {
      await Watching.destroy({
        where: { id: anime.watchingId },
      });
    }

    // Adds the anime and watching row immediately if watching is empty
    if (rating.length === 0) {
      const ratingAdded = await Rating.create({
        year: +date[0],
        month: +date[1],
        day: +date[2],
        rate: rate,
        userId: userId,
      });
      await Anime.create({
        ...anime,
        ratingId: ratingAdded.id,
        watchingId: null,
        planToWatchId: null,
      });
      return res.status(200).json({ message: "Anime Added to Watch List!" });
    }

    // Checks if this anime is a duplicate
    for (let rate of rating) {
      const [animeFound] = await Anime.findAll({
        where: { ratingId: rate.id },
      });

      if (anime.name === animeFound.name) {
        throw new Error("Anime already exist!");
      }
    }

    // Creates watching and anime row
    const rateAdded = await Rating.create({
      year: +date[0],
      month: +date[1],
      day: +date[2],
      rate: rate,
      userId: userId,
    });
    await Anime.create({
      ...anime,
      ratingId: rateAdded.id,
      watchingId: null,
      planToWatchId: null,
    });

    // return success and data
    return res.status(200).json({ message: "Anime Added to Watch List!" });
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};
exports.patchRating = async (req, res, next) => {
  const userId = req.userId;
  const rateId = req.params.id;
  const newRate = req.body.rate.rate;

  try {
    await Rating.update(
      { rate: newRate },
      {
        where: { userId: userId, id: rateId },
      }
    );
    res.status(200).json({ message: "Rate has been updated" });
  } catch (err) {
    next(err);
  }
};
exports.deleteRating = async (req, res, next) => {
  const userId = req.userId;
  const rateId = req.params.id;

  try {
    // Delete the specific watch row
    await Rating.destroy({
      where: { userId: userId, id: rateId },
    });
    return res.status(200).json({ message: "Anime Successfully Deleted!" });
  } catch (err) {
    console.log(err.message);
    next(err);
  }
};
