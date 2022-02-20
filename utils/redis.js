const { createClient } = require("redis");

const redis = createClient({
  port: 6379,
});

module.exports = redis;
