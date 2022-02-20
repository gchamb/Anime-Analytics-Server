const express = require("express");

const router = express.Router();
const jikan = require("../controllers/jikanController");

router.get("/discover", jikan.cacheDiscover, jikan.getDiscover);
router.get("/search/:animeId", jikan.cacheSearch, jikan.getSearch);
router.get("/browse/:type", jikan.checkBrowseCache, jikan.getBrowse);
module.exports = router;
