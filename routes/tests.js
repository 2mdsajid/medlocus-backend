const express = require("express");
const router = express.Router();

const {
  MECSYLLABUS,
  UNITWEIGHTAGE,
  SUBJECTWEIGHTAGE,
  UPDATED_SYLLABUS,
} = require("../public/syllabus.js");

const DailyTest = require("../schema/dailytest");
const Question = require("../schema/question");
const Botany = require("../schema/botany");
const Zoology = require("../schema/zoology");
const Physics = require("../schema/physics");
const Chemistry = require("../schema/chemistry");
const Mat = require("../schema/mat");
const { VerifyUser, VerifyAdmin } = require("../middlewares/middlewares");

const createTodayDateId = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Month is zero-based
  const day = String(currentDate.getDate()).padStart(2, "0");
  const dateid = `${year}-${month}-${day}`;
  return dateid;
};

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
      return "zoology";
  }

  return SubjectModel;
};

const groupQuestionsBySubject = async (questions) => {
  const questionarray = {};

  for (const subject of Object.keys(SUBJECTWEIGHTAGE)) {
    questionarray[subject] = questions.filter(
      (question) => question.subject === subject
    );
  }
  return questionarray;
};

router.get("/testquestions/:typeoftest", async (req, res) => {
  const { model, num, sub, chap, unit } = req.query;
  const { typeoftest } = req.params;
  const numberofquestions = parseInt(num);
  const TEST_TYPES = [
    "chapterwise",
    "unitwise",
    "subjectwise",
    "modeltest",
    "dailytest",
    "weeklytest",
  ];

  if (!TEST_TYPES.includes(typeoftest)) {
    return res.status(400).json({
      message: "Missing some parameters - type",
    });
  }

  if (["chapterwise", "unitwise", "subjectwise"].includes(typeoftest)) {
    if (!sub || !(sub in SUBJECTWEIGHTAGE)) {
      return res.status(400).json({
        message: "Invalid or missing subject",
      });
    }

    if (typeoftest === "unitwise" || typeoftest === "chapterwise") {
      if (!unit || !(unit in UNITWEIGHTAGE[sub])) {
        return res.status(400).json({
          message: "Invalid or missing unit",
        });
      }
    }

    if (typeoftest === "chapterwise") {
      const units = UPDATED_SYLLABUS.subjects
        .find((s) => s.name === sub)
        .units.find((s) => s.mergedunit === unit);
      if (!chap || !units.topics.includes(chap)) {
        return res.status(400).json({
          message: "Invalid or missing chapter",
        });
      }
    }

    if (!numberofquestions || numberofquestions > 50 || numberofquestions < 5) {
      return res.status(400).json({
        message: "Number of questions must be in range 5 - 50",
      });
    }
  }

  // /* SUBJECTWISE TEST ----------------------------------------- */
  if (typeoftest === "subjectwise") {
    const questions = await Question.aggregate([
      { $match: { subject: sub } },
      { $sample: { size: numberofquestions } },
      {
        $project: {
          question: 1,
          options: 1,
          answer: 1,
          explanation: 1,
          subject: 1,
          chapter: 1,
          _id: 1,
        },
      },
      {
        $set: {
          uans: "",
          timetaken: 0,
        },
      },
    ]).exec();
    if (questions.length < 0) {
      return res.status(400).json({
        message: "no questions from this subject",
      });
    }
    const groupedQuestions = await groupQuestionsBySubject(questions);
    return res.status(200).json({
      message: "Chapter questions founddddd",
      questions: groupedQuestions,
    });
  }
  ///* UNIT WISE */-------------------------------
  else if (typeoftest === "unitwise") {
    const questions = await Question.aggregate([
      { $match: { subject: sub, mergedunit: unit } },
      { $sample: { size: numberofquestions } },
      {
        $project: {
          question: 1,
          options: 1,
          answer: 1,
          explanation: 1,
          subject: 1,
          chapter: 1,
          _id: 1,
        },
      },
      {
        $set: {
          uans: "",
          timetaken: 0,
        },
      },
    ]).exec();
    if (questions.length === 0) {
      return res.status(400).json({
        message: "No questions found",
      });
    }
    const groupedQuestions = await groupQuestionsBySubject(questions);
    return res.status(200).json({
      message: "unit questions founddddd",
      questions: groupedQuestions,
    });
  }
  // /* CHAPTERWISE------------------------------------------------------ */
  else if (typeoftest === "chapterwise") {
    const questions = await Question.aggregate([
      { $match: { subject: sub, mergedunit: unit, chapter: chap } },
      { $sample: { size: numberofquestions } },
      {
        $project: {
          question: 1,
          options: 1,
          answer: 1,
          explanation: 1,
          subject: 1,
          chapter: 1,
          _id: 1,
        },
      },
      {
        $set: {
          uans: "",
          timetaken: 0,
        },
      },
    ]).exec();
    if (questions.length === 0) {
      return res.status(400).json({
        message: "No questions found",
      });
    }
    const groupedQuestions = await groupQuestionsBySubject(questions);
    return res.status(200).json({
      message: "unit questions founddddd",
      questions: groupedQuestions,
    });
  }
  // /* MODEL TEST ---------------------------------- */
  else if (typeoftest === "modeltest") {
    if (![50, 100, 150, 200].includes(numberofquestions)) {
      return res.status(400).json({
        message: "number of questions not matched or unusual",
        status: 300,
      });
    }
    const fraction = numberofquestions / 200;
    const subjectKeys = Object.keys(SUBJECTWEIGHTAGE);
    const questions = [];

    for (const subject of subjectKeys) {
      const SubjectModel = getModelBasedOnSubject(subject);
      const numberOfQuestions = Math.ceil(SUBJECTWEIGHTAGE[subject] * fraction);
      const totalQuestionsInModel = await SubjectModel.countDocuments();

      const questionsToFetch = Math.min(
        numberOfQuestions,
        totalQuestionsInModel
      );
      // const randomQuestions = await SubjectModel.aggregate([
      //   { $sample: { size: questionsToFetch } },
      // ]);

      // const populatedQuestions = await SubjectModel.populate(randomQuestions, {
      //   path: "questionid",
      //   select: "question options answer explanation subject chapter _id",
      // });

      const selectedquestions = await Question.aggregate([
        { $match: { subject: subject } },
        { $sample: { size: questionsToFetch } },
        {
          $project: {
            question: 1,
            options: 1,
            answer: 1,
            explanation: 1,
            subject: 1,
            chapter: 1,
            _id: 1,
          },
        },
        {
          $set: {
            uans: "",
            timetaken: 0,
          },
        },
      ]).exec();

      // const questionIds = populatedQuestions.map((item) => item.questionid);
      questions.push(...selectedquestions);
    }

    if (questions.length > numberofquestions) {
      questions.pop();
    }

    const groupedQuestions = await groupQuestionsBySubject(questions);
    return res.status(200).json({
      message: "model questions found",
      questions: groupedQuestions,
    });
  }
  // /* DAILY TEST---------------------------- */
  else if (typeoftest === "dailytest") {
    const dateid = createTodayDateId();
    const testquestions = await DailyTest.findOne({ dateid: dateid })
      .populate({
        path: "questions.question",
        model: Question,
        select: "question options answer explanation subject chapter _id",
      })
      .lean();

    if (!testquestions) {
      return res.status(404).json({
        message: "Daily test not found",
      });
    }
    const questions = await testquestions.questions.map((question) => {
      return question.question;
    });
    const modifiedquestions = await questions.map((question) => ({
      ...question,
      uans: "",
      timetaken: 0,
    }));

    const groupedQuestions = await groupQuestionsBySubject(modifiedquestions);
    return res.status(200).json({
      message: "Daily test retrieved successfully",
      questions: groupedQuestions,
    });
  }

  return res.status(404).json({
    message: "Type of test not found",
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

            const randomQuestions = await subjectModel.aggregate([
              { $match: { mergedunit: mergedunit } },
              { $sample: { size: numberOfQuestions } },
            ]);
            finalquestions.push(...randomQuestions);
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
      savedtest: savedtest.questions.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/getdailytests", VerifyUser, async (req, res) => {
  const { i } = req.query;
  if (i) {
    const dailytest = await DailyTest.findOne({ dateid: i })
      .populate({
        path: "questions.question",
        model: Question,
        select: "question options answer _id",
      })
      .lean();
    if (!dailytest) {
      return res.status(400).json({
        message: "cant find test",
      });
    }

    dailytest.usersattended = dailytest.usersattended
      .sort((a, b) => Number(b.totalscore) - Number(a.totalscore))
      .map((user, index) => ({ ...user, rank: index + 1 }));

    return res.status(200).json({
      message: "Tests fetched",
      test: dailytest,
    });
  }

  const dailytests = await DailyTest.find({ archive: true }).select(
    "_id dateid"
  );
  if (!dailytests) {
    return res.status(400).json({
      message: "cant find tests",
    });
  }
  return res.status(200).json({
    message: "Tests fetched",
    tests: dailytests,
  });
});

module.exports = router;
