const mongoose = require("mongoose");

const dailytest = mongoose.Schema({
  dateid: {
    type: String,
    required: true,
  },
  questions: [
    {
      question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    },
  ],
  archive: {
    type: Boolean,
    default: false,
  },
  usersconnected: {
    type: [String],
    default: [],
  },
  usersattended: [
    {
      userid: {
        type: String,
      },
      totalscore: {
        type: String,
      },
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
});

const DailyTest = mongoose.model("dailytest", dailytest);

module.exports = DailyTest;
