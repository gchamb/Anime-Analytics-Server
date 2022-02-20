const redis = require("../utils/redis");
const jikan = require("jikanjs");

// Checking for cached data for the discover page
exports.cacheDiscover = async (req, res, next) => {
  try {
    // checks connection to redis
    const checkConnection = await redis.ping();
    if (checkConnection === "PONG") {
      // query data
      const data = await redis.get("discover");
      // go to next middleware if null
      if (data === null) {
        return next();
      }
      // return the data if not null
      return res.status(200).json(JSON.parse(data));
    }
  } catch (error) {
    next();
  }
};
exports.getDiscover = async (req, res, next) => {
  const today = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ][new Date().getDay()];

  // Call API if not in cache
  const topAiring = await jikan.loadTop("anime", 1, "airing");
  const todayAnimes = await jikan.loadSchedule(today);
  const topByPop = await jikan.loadTop("anime", 1, "bypopularity");

  const discover = {
    topAiring: topAiring.top,
    todayAnimes: todayAnimes[today],
    topByPop: topByPop.top,
  };
  // cache the data for a day
  redis.setEx("discover", 86400, JSON.stringify(discover));
  return res.status(200).json(discover);
};

exports.cacheSearch = async (req, res, next) => {
  const animeId = req.params.animeId;
  try {
    // checks connection to redis
    const checkConnection = await redis.ping();
    if (checkConnection === "PONG") {
      // query data
      const data = await redis.get(animeId);
      // go to next middleware if null
      if (data === null) {
        return next();
      }
      // return the data if not null
      return res.status(200).json(JSON.parse(data));
    }
  } catch (error) {
    next();
  }
};

exports.getSearch = async (req, res, next) => {
  const animeId = req.params.animeId;
  // Call API if not in cache
  const anime = await jikan.loadAnime(animeId);

  // cache the data for a 5 hrs
  redis.setEx(animeId, 18000, JSON.stringify(anime));
  return res.status(200).json(anime);
};

exports.checkBrowseCache = async (req, res, next) => {
  let type = req.params.type;
  let isOther = false;
  const today = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ][new Date().getDay()];

  if (type === "airing") {
    type = "topAiring";
  } else if (type === "popular") {
    type = "topByPop";
  } else if (type === today) {
    type = "todayAnimes";
  } else {
    isOther = true;
  }

  try {
    // checks connection to redis
    const checkConnection = await redis.ping();
    if (checkConnection === "PONG") {
      if (!isOther) {
        // query data
        const data = await redis.get("discover");

        const parsedData = JSON.parse(data)[type];
        // return the data if not null
        return res.status(200).json(parsedData);
      } else {
        const data = await redis.get(type);

        if (data === null) {
          return next();
        }
        const parsedData = JSON.parse(data);
        // return the data if not null
        return res.status(200).json(parsedData);
      }
    }
  } catch (error) {
    next();
  }
};

exports.getBrowse = async (req, res, next) => {
  const type = req.params.type;
  const today = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  if (today.includes(type)) {
    // Call API if not in cache
    const todayAnimes = await jikan.loadSchedule(type);

    // cache the data for a day
    redis.setEx(type, 86400, JSON.stringify(todayAnimes[type]));
    return res.status(200).json(todayAnimes[type]);
  } else {
    const topOther = await jikan.loadTop("anime", 1, type);
    // cache the data for a day
    redis.setEx(type, 86400, JSON.stringify(topOther.top));
    return res.status(200).json(topOther.top);
  }
};
