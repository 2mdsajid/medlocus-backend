const mongoose = require("mongoose");

const unsubscribed = new mongoose.Schema({
  emails: {
    type: [String],
  },
});

const Unsubscribed = mongoose.model("Unsubscribed", unsubscribed);

module.exports = Unsubscribed;
