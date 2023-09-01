const express = require("express");
const router = express.Router();

const {
  MECSYLLABUS,
  UNITWEIGHTAGE,
  SUBJECTWEIGHTAGE,
} = require("../public/syllabus.js");

const Question = require("../schema/question"); // Import the Question model
const Botany = require("../schema/botany");
const Zoology = require("../schema/zoology");
const Physics = require("../schema/physics");
const Chemistry = require("../schema/chemistry");
const Mat = require("../schema/mat");
const DailyTest = require("../schema/dailytest");

// Function to generate random questions based on unit weightage
const generateRandomQuestions = () => {
  return;
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

let i = 0;
const saveQuestionToSubjects = async () => {
  return;
  const questions = await Question.find();
  for (const question of questions) {
    i = i + 1;
    const SubjectModel = getModelBasedOnSubject(question.subject);
    const newSubjectEntry = new SubjectModel({
      mergedunit: question.mergedunit,
      questionid: question._id,
    });
    await newSubjectEntry.save();
  }
};

// saveQuestionToSubjects()

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

  return SubjectModel;
};

const isTopicPresent = (subjectName, topicToCheck) => {
  const subject = MECSYLLABUS.subjects.find(
    (subject) => subject.name === subjectName
  );
  if (subject) {
    const unitsWithTopic = subject.units.filter((unit) =>
      unit.topics.includes(topicToCheck)
    );
    return unitsWithTopic.length > 0;
  }
  return false;
};

const createTodayDateId = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Month is zero-based
  const day = String(currentDate.getDate()).padStart(2, "0");
  const dateid = `${year}-${month}-${day}`;
  return dateid;
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
      newsubject = subject;
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
      const PreviousSubjectModel = getModelBasedOnSubject(previoussubject);
      if (PreviousSubjectModel) {
        await PreviousSubjectModel.deleteOne({
          questionid: savedQuestion._id,
          mergedunit: previousmergedunit,
        });
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

router.get("/testquestions/:typeoftest", async (req, res) => {
  const { model, num, sub, chap } = req.query;
  const { typeoftest } = req.params;
  if (typeoftest === "chapterwise") {
    // for chapterwise test
    if (!sub || !(sub in SUBJECTWEIGHTAGE)) {
      return res.status(400).json({
        message: "Invalid or missing subject",
        status: 400,
      });
    }

    if (!chap || !isTopicPresent(sub, chap)) {
      return res.status(400).json({
        message:
          "Invalid or missing chapter or chapter not found for the subject",
        status: 400,
      });
    }

    if (num > 50) {
      return res.status(400).json({
        message: "Number of questions cannot exceed 50",
        status: 400,
      });
    }

    const chapquestions = await Question.find(
      {
        subject: sub,
        chapter: chap,
      },
      "question options answer explanation _id"
    );
    if (chapquestions.length < 0) {
      return res.status(400).json({
        message: "cant get chapter questions",
        status: 400,
      });
    }

    return res.status(200).json({
      message: "Chapter questions found",
      status: 200,
      questions: chapquestions,
    });
  } else if (typeoftest === "modeltest") {
    const qnnum = parseInt(num);
    if (![50, 100, 150, 200].includes(qnnum)) {
      return res.status(400).json({
        message: "number of questions not matched or unusual",
        status: 300,
      });
    }
    const fraction = qnnum / 200;
    const subjectKeys = Object.keys(SUBJECTWEIGHTAGE);
    const allRandomQuestions = [];

    for (const subject of subjectKeys) {
      const SubjectModel = getModelBasedOnSubject(subject);
      const numberOfQuestions = Math.ceil(SUBJECTWEIGHTAGE[subject] * fraction);
      const totalQuestionsInModel = await SubjectModel.countDocuments();

      const questionsToFetch = Math.min(
        numberOfQuestions,
        totalQuestionsInModel
      );
      const randomQuestions = await SubjectModel.aggregate([
        { $sample: { size: questionsToFetch } },
      ]);

      const populatedQuestions = await SubjectModel.populate(randomQuestions, {
        path: "questionid",
        select: "question options answer explanation _id",
      });

      const questionIds = populatedQuestions.map((item) => item.questionid);

      allRandomQuestions.push(...questionIds);
    }

    if (allRandomQuestions.length > qnnum) {
      allRandomQuestions.pop();
    }

    return res.status(200).json({
      message: "Questions fetched successfully",
      status: 200,
      questions: allRandomQuestions,
    });
  } else if (typeoftest === "dailytest") {
    const dateid = createTodayDateId();
    const test = await DailyTest.findOne({
      dateid: dateid,
    }).populate({
      path: "questions.question", 
      model: Question, 
      select: "question options answer explanation _id", 
    });

    if (!test) {
      return res.status(404).json({
        message: "Daily test not found",
        status: 404,
      });
    }

    return res.status(200).json({
      message: "Daily test retrieved successfully",
      status: 200,
      test: test,
    });
  }

  return res.status(404).json({
    message: "Type of test not found",
    status: 404,
  });
});

router.get("/createdailytest", async (req, res) => {
  try {
    let finalquestions = [];
    const dateid = createTodayDateId();
    for (const subject in UNITWEIGHTAGE) {
      if (UNITWEIGHTAGE.hasOwnProperty(subject)) {
        const subjectModel = getModelBasedOnSubject(subject);
        const unitWeightage = UNITWEIGHTAGE[subject];

        for (const mergedunit in unitWeightage) {
          if (unitWeightage.hasOwnProperty(mergedunit)) {
            const numberOfQuestions = unitWeightage[mergedunit];

            try {
              const randomQuestions = await subjectModel.aggregate([
                { $match: { mergedunit: mergedunit } },
                { $sample: { size: numberOfQuestions } },
              ]);
              finalquestions.push(...randomQuestions);
            } catch (error) {
              console.error(
                `Error fetching questions for ${subject} - ${mergedunit}: ${error}`
              );
            }
          }
        }
      }
    }

    const questionsArray = finalquestions.map((questionid) => {
      return {
        question: questionid.questionid,
      };
    });
    
    const dailytest = new DailyTest({
      dateid: dateid,
      questions: questionsArray, 
    });

    const savedtest = await dailytest.save();

    return res.status(200).json({
      message: "Daily test created successfully",
      status: 200,
      savedtest: savedtest.questions.length,
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
