const express = require("express");
const router = express.Router();
const { info, user } = require("../schema/models.js");

const { MECSYLLABUS, UNITWEIGHTAGE } = require("../public/syllabus.js");

const Question = require("../schema/question"); // Import the Question model
const Botany = require("../schema/botany");
const Zoology = require("../schema/zoology");
const Physics = require("../schema/physics");
const Chemistry = require("../schema/chemistry");
const Mat = require("../schema/mat");

// Function to generate random questions based on unit weightage
const generateRandomQuestions = () => {
  const randomQuestions = [];

  Object.entries(UNITWEIGHTAGE).forEach(([mergedunit, numQuestions]) => {
    const subjectWithUnit = MECSYLLABUS.subjects.find((subject) =>
      subject.units.some((unit) => unit.mergedunit === mergedunit)
    );

    if (!subjectWithUnit) return;

    const unitInfo = subjectWithUnit.units.find(
      (unit) => unit.mergedunit === mergedunit
    );

    for (let i = 0; i < numQuestions; i++) {
      const randomTopicIndex = Math.floor(
        Math.random() * unitInfo.topics.length
      );
      const randomTopic = unitInfo.topics[randomTopicIndex];
      const randomAnswerOption = ["a", "b", "c", "d"][
        Math.floor(Math.random() * 4)
      ];
      const randomDifficulty = ["e", "m", "h", "p"][
        Math.floor(Math.random() * 4)
      ];

      const newQuestion = {
        question: `Question about ${randomTopic}`,
        options: {
          a: "Option A",
          b: "Option B",
          c: "Option C",
          d: "Option D",
        },
        answer: randomAnswerOption, // Set the correct answer
        explanation: `explanation about the question from chapter ${randomTopic} of subject ${subjectWithUnit.name}`,
        subject: subjectWithUnit.name, // Set the subject from the found subject
        chapter: randomTopic,
        mergedunit,
        difficulty: randomDifficulty, // Set the difficulty
        isadded: {
          state: true,
          by: "51ae7f08-9e06-41b7-a00c-5c4567a01a50",
        },
      };
      randomQuestions.push(newQuestion);
    }
  });

  return randomQuestions;
};

// Simulate adding random questions to the database
const addRandomQuestionsToDatabase = async () => {
  const randomQuestions = generateRandomQuestions();

  try {
    await Question.insertMany(randomQuestions);
    console.log("Random questions added successfully.");
  } catch (error) {
    console.error("Error adding random questions:", error);
  }
};

// Call the function to add random questions to the database
// addRandomQuestionsToDatabase();

const getModelBasedOnSubject = (subject) => {
  let SubjectModel;
  switch (subject) {
    case "botany":
      SubjectModel = Botany;
      break;
    case "zoology":
      SubjectModel = Zoology;
      break;
    case "physics":
      SubjectModel = Physics;
      break;
    case "chemistry":
      SubjectModel = Chemistry;
      break;
    case "mat":
      SubjectModel = Mat;
      break;
    default:
      // Handle invalid subject
      return res.status(400).json({
        message: "Invalid subject",
        status: 400,
      });
  }

  return SubjectModel
};

router.post("/savequestion", async (req, res) => {
  try {
    const {
      _id,
      question,
      options,
      answer,
      explanation,
      subject,
      chapter,
      mergedunit,
      ispast,
      difficulty,
      isadded,
      isreviewed,
    } = req.body.questionElement;

    let existingQuestion;
    let message;
    let previoussubject;
    let newsubject;
    let previousmergedunit;

    if (_id) {
      existingQuestion = await Question.findOne({ _id });
      previoussubject = existingQuestion.subject;
      previousmergedunit = existingQuestion.mergedunit;

      existingQuestion.question = question;
      existingQuestion.options = options;
      existingQuestion.answer = answer;
      existingQuestion.explanation = explanation;
      existingQuestion.subject = subject;
      existingQuestion.chapter = chapter;
      existingQuestion.difficulty = difficulty;
      existingQuestion.mergedunit = mergedunit;
      existingQuestion.ispast = ispast;
      existingQuestion.isverified.by = isreviewed.by;
      existingQuestion.isverified.state = true;
      newsubject = subject
      message = "Question Reviewed Successfully";
    } else {
      existingQuestion = new Question({
        question,
        options,
        answer,
        explanation,
        subject,
        chapter,
        mergedunit,
        ispast,
        difficulty,
        isadded,
      });
      newsubject = subject;
      message = "Question Added Successfully";
    }

    const savedQuestion = await existingQuestion.save();

    const SubjectModel = getModelBasedOnSubject(newsubject);
    const questioninmodelnew = await SubjectModel.findOne({
      questionid: savedQuestion._id,
      mergedunit: savedQuestion.mergedunit,
    });

    if (!questioninmodelnew) {
      const newSubjectEntry = new SubjectModel({
        mergedunit: savedQuestion.mergedunit,
        questionid: savedQuestion._id,
      });
      await newSubjectEntry.save();
    }
  
    if (previousmergedunit !== savedQuestion.mergedunit) {
      const PreviousSubjectModel = getModelBasedOnSubject(previoussubject)
      if (PreviousSubjectModel) {
        await PreviousSubjectModel.deleteOne({ questionid: savedQuestion._id, mergedunit: previousmergedunit });
      }
    }

    return res.status(200).json({
      message,
      status: 200,
      meaning: "ok",
      elem: {
        _is: savedQuestion._id,
        isaddedby: savedQuestion.isadded.by,
        isverified: savedQuestion.isverified.by,
        isreportedby: savedQuestion.isreported.by,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error saving question",
      status: 500,
      meaning: "internalerror",
      error: error.message,
    });
  }
});

router.get("/getreviewquestions", async (req, res) => {
  const num = req.query.n;
  const type = req.query.t;
  if (!req.query.n) {
    return res.status(400).json({
      message: "Missing parameter: number of questions",
      status: 400,
      meaning: "badrequest",
    });
  }

  try {
    let questions = [];

    if (type === "reported") {
      questions = await Question.aggregate([
        { $match: { "isreported.state": true } },
        { $sample: { size: Number(num) } },
      ]).exec(); // Convert the aggregation result to a Promise using .exec()
    } else {
      questions = await Question.aggregate([
        { $match: { "isverified.state": false } },
        { $sample: { size: Number(num) } },
      ]).exec(); // Convert the aggregation result to a Promise using .exec()
    }

    const formattedQuestions = questions.map((question) => ({
      _id: question._id,
      question: question.question,
      options: question.options,
      answer: question.answer,
      explanation: question.explanation,
      subject: question.subject,
      chapter: question.chapter,
      mergedunit: question.mergedunit,
      ispast: question.ispast,
      isreported: question.isreported,
      difficulty: question.difficulty,
    }));

    return res.status(200).json({
      message: "Review questions fetched successfully",
      status: 200,
      meaning: "ok",
      questions: formattedQuestions,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching review questions",
      status: 500,
      meaning: "internalerror",
      error: error.message,
    });
  }
});

router.post("/reportquestion", async (req, res) => {
  const { message, questionid } = req.body;

  if (!message || !questionid) {
    return res.status(400).json({
      message: "Missing parameters",
      status: 400,
      meaning: "badrequest",
    });
  }

  try {
    const question = await Question.findById(questionid);

    if (!question) {
      return res.status(404).json({
        message: "Question not found",
        status: 404,
        meaning: "notfound",
      });
    }

    const authHeader = req.headers.authorization;
    const userid = authHeader.split(" ")[1];
    question.isreported.state = true;
    question.isreported.by = userid;
    question.isreported.msg = message;

    await question.save();

    return res.status(200).json({
      message: "Question reported successfully",
      status: 200,
      meaning: "ok",
      report: question.isreported,
      questionid: question._id,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error reporting review questions",
      status: 500,
      meaning: "internalerror",
      error: error.message,
    });
  }
});

router.get("/getqnbyid", async (req, res) => {
  const id = req.query.i;
  if (!id) {
    return res.status(400).json({
      message: "Missing parameter: question ID",
      status: 400,
      meaning: "badrequest",
    });
  }

  try {
    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        message: "Question not found",
        status: 404,
        meaning: "notfound",
      });
    }

    const formattedQuestion = {
      _id: question._id,
      question: question.question,
      options: question.options,
      answer: question.answer,
      explanation: question.explanation,
      subject: question.subject,
      chapter: question.chapter,
      mergedunit: question.mergedunit,
      ispast: question.ispast,
      difficulty: question.difficulty,
    };

    return res.status(200).json({
      message: "Question fetched successfully",
      status: 200,
      meaning: "ok",
      question: formattedQuestion,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching question",
      status: 500,
      meaning: "internalerror",
      error: error.message,
    });
  }
});

router.get("/q", async (req, res) => {
  try {
    const dat = new user({
      fullname: "sajid",
      email: "sajid@gmail.com",
      password: "passss",
    });

    await dat.save();

    return res.status(200).json({
      message: "Question saved successfully",
      status: 200,
      meaning: "ok",
      question: dat,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error saving question",
      status: 500,
      meaning: "internalerror",
      error: error.message,
    });
  }
});

router.get("/getuser", async (req, res) => {
  try {
    const infos = await info.find();
    return res.status(200).json({
      message: "Question saved successfully",
      status: 200,
      meaning: "ok",
      infos,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error saving question",
      status: 500,
      meaning: "internalerror",
      error: error.message,
    });
  }
});

module.exports = router;
