const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  options: {
    type: {
      a: String,
      b: String,
      c: String,
      d: String,
    },
    required: true,
  }, 
  answer: {
    type: String,
    required: true,
  },
  explanation: {
    type: String,
    default: "",
  },
  images: {
    qn: String,
    a: String,
    b: String,
    c: String,
    d: String,
    exp: String,
  },
  subject: {
    type: String,
    required: true,
  },
  chapter: {
    type: String,
    required: true,
  },
  mergedunit: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: "mbbs",
  },
  ispast: {
    type: String,
    default: "2023",
  },
  difficulty: {
    type: String,
    default:'m',
  },
  isadded: {
    state: {
      type: Boolean,
      default: false,
    },
    by: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  isreported: {
    state: {
      type: Boolean,
      default: false,
    },
    by: {
      type: String,
    },
    message: {
      type: String,
    },
    date: {
      type: Date,
    },
  },
  isverified: {
    state: {
      type: Boolean,
      default: false,
    },
    by: {
      type: String,
    },
    date: {
      type: Date,
    },
  },
  isflagged: {
    state: {
      type: Boolean,
      default: false,
    },
    by: {
      type: String,
    },
    message: {
      type: String,
    },
    date: {
      type: Date,
    },
  },
  attempt: {
    type: Number,
    default: 0, //to track admin added question verified or not
  },
  correctattempt: {
    type: Number,
    default: 0,
  },
  timetaken: {
    type: Number,
    default: 0,
  },
});

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;
