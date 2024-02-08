const mongoose = require("mongoose");

const { generateVerificationKey } = require('../public/utils')

const organizationSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true
  },
  uniqueId: {
    type: String,
    unique: true,
    required: true
  },
  image: {
    type: String
  },
  keys: {
    moderator: {
      type: String,
      default: generateVerificationKey(4),
      required: true,
    },
    user: {
      type: String,
      default: generateVerificationKey(4),
      required: true,
    }
  },
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  tests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customtest",
  }],
  payment: {
    isPaid: {
      type: Boolean,
      default: false
    },
    paymentID: String,
    expireAt: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
});

const Organization = mongoose.model("Organization", organizationSchema);

module.exports = Organization;
