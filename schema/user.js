const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true
  },
  image: {
    type: String
  },
  medpoints: {
    type: Number,
    default: 2500
  },
  role: {
    type: String,
    enum: ["user", "admin", "sajid", "moderator", "submoderator"],
    default: "user"
  },
  key: {
    type: String,
    default: ""
  },
  ip: {
    type: String
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question"
  }],
  discussions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Discussion"
  }],
  notes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Note"
  }],
  organizations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization"
  }],
  analytic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Analytic"
  },
  isModerator: {
    type: Boolean,
    default: false
  },
  payment: {
    isPaid: {
      type: Boolean,
      default: false
    },
    method: {
      type: String,
      enum: ["organization", "premium", null],
      default: null
    },
    organizationId: mongoose.Schema.Types.ObjectId,
    transactionId: String,
    expireAt: Date,
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  tokensUsed: [String],
  institution: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
