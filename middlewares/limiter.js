const rateLimit = require("express-rate-limit");

const limitermiddleware = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 1000,
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

// to limits the number of times questions can be imported 
const importquestionlimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: (req, res) => {
    const isPremium = req.isPremium || false
    const isAdminAccess = req.isAdminAccess || false
    if (isAdminAccess || isPremium) {
      return 40; 
    } else {
      return 6;
    }
  },
  message: {
    message: "Looks like you have exceeded your limits to import questions. You can do after 24 hours!",
    status: 429,
  },
});


const testing_role_based_limmitter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: (req, res) => {
    const userRole = req.user ? req.user.role : 'guest';
    if (userRole === 'admin') {
      return 3; 
    } else {
      return 6; 
    }
  },
  message: {
    message: "limit reached.",
    status: 429,
  },
});

module.exports = {
  importquestionlimiter,
  limitermiddleware,
  newquestionlimiter,
  testing_role_based_limmitter
};
