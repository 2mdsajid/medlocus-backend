const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  username: {
    type: "string",
    required: true,
  },
  uuid: {
    type: "string",
    required: true,
    unique: true,
  },
  password: {
    type: "string",
    required: true,
  },
  questions: {
    type: "number",
    default:0,
  },
  questionsVerified: {
    type: "number",
    default:0,
  },
  name: {
    type: "string",
    required: true,
  },
  email: {
    type: "string",
    required: true,
  },
  key: {
    type: "string",
    required: true,
  },
});

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
