const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  mergedunit: {
    type: String,
    required: true,
  },
  chapter: {
    type: String,
    required: true,
  },
  questionid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
  },
});

const Question = mongoose.model("Zoology", questionSchema);

module.exports = Question;
