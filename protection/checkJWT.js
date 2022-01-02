const jwt = require("jsonwebtoken");
exports.SECRET = "secret";
exports.isAuth = (req, res, next) => {
  // Gets the token out of the Header
  const token = req.get("Authorization").split(" ")[1];
  // If there is no token return not authenticated
  if (!token) {
    const err = new Error("Not Authenticated");
    err.status = 401;
    next(err);
  }

  let decodedToken;
  try {
    // Checks if the token is valid
    decodedToken = jwt.verify(token, this.SECRET);
  } catch (err) {
    // If not valid then return not authenticated
    const error = new Error("Not Authenticated");
    error.status = 401;
    next(error);
  }

  // attaches the user id from the token to all of the requests for the user
  req.userId = +decodedToken.userId;
  next(); // next to go to the other middleware
};
