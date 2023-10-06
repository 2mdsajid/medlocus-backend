const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  username: {
    type: "string",
    required: true,
  },
  password: {
    type: "string",
    required: true,
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
