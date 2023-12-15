const mongoose = require("mongoose");

const dailytest = mongoose.Schema({
  type: {
    type: String,
    enum: ["dailytest", "weeklytest", "sponsored", "sujectwiseseries"],
    required: true,
    default: "dailytest",
  },
  isSponsored: {
    state: {
      type: Boolean,
      default: false,
    },
    by: {
      type: String,
    },
    image: {
      type: String,
    },
  },
  dateid: {
    type: String,
    required: true,
  },
  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
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
      name: {
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
