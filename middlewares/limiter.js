const rateLimit = require("express-rate-limit");

const limitermiddleware = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 20,
  message: {
    message:
      "Looks like you have exceeded your daily tests limit. Come back tomorrow !",
    status: 429,
  },
});

const newquestionlimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 10,
  message: {
    message: "Looks like you have exceeded your limits to add a new question. Thanks for your contribution !",
    status: 429,
  },
});

module.exports = {
  limitermiddleware,
  newquestionlimiter,
};
