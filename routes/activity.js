const express = require("express");

const router = express.Router();
const act = require("../controllers/activityController");
const protection = require("../protection/checkJWT").isAuth;

/* Watching List Routes*/
// GET => returns the watching list of a user
router.get("/watching&page=:pg", protection, act.getWatching);
// POST => adds anime to watching list
router.post("/watching", protection, act.postWatching);
// DELETE => deletes anime from watching list
router.delete("/watching/:id", protection, act.deleteWatching);

/* Plan to Watch List Routes */
// GET => returns the plan to watch list of a user
router.get("/plan&page=:pg", protection, act.getPlanToWatch);
// POST => adds anime to plan to watch list
router.post("/plan", protection, act.postPlanToWatch);
// DELETE => deletes animes from plan to watch list
router.delete("/plan/:id", protection, act.deletePlanToWatch);

/* List Sharing Route */
router.get("/shared/:token&page=:pg", act.getShared);
router.get("/share", protection, act.getShare);

/* Stat Routes */
// GET => returns the stats of a user based from their animes
router.get("/stats", protection, act.getStats);

/* Rating List Routes */
// GET => returns the animes that the user rated
router.get("/rating&page=:pg", protection, act.getRating);
// POST => add the animes that the user rated
router.post("/rating", protection, act.postRating);
// PATCH => update the animes that the user rated
router.patch("/rating/:id", protection, act.patchRating);
// DELETE => update the animes that the user rated
router.delete("/rating/:id", protection, act.deleteRating);

module.exports = router;
