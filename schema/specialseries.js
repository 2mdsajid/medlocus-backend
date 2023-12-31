const mongoose = require("mongoose");

const specialseries = mongoose.Schema({
  type: {
    type: String,
    enum: ["daily", "weekly", "sponsored", "sujectwiseseries", "prayash"],
    required: true,
    default: "daily",
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
      default:'https://res.cloudinary.com/dww0rxb4q/image/upload/v1701594279/per5j19vm0oshffpzda0.jpg',
    },
  },
  dateid: {
    type: String,
    required: true,
  },
  questions: {},
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

const SpecialSeries = mongoose.model("specialseries", specialseries);

module.exports = SpecialSeries;
