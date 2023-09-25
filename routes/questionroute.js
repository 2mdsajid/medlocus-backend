const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

const {
  MECSYLLABUS,
  UNITWEIGHTAGE,
  SUBJECTWEIGHTAGE,
  UPDATED_SYLLABUS,
} = require("../public/syllabus.js");
const Question = require("../schema/question"); // Import the Question model
const Botany = require("../schema/botany");
const Zoology = require("../schema/zoology");
const Physics = require("../schema/physics");
const Chemistry = require("../schema/chemistry");
const Mat = require("../schema/mat");
const DailyTest = require("../schema/dailytest");

const { VerifyUser, VerifyAdmin } = require("../middlewares/middlewares");

// Function to generate random questions based on unit weightage
const generateRandomQuestions = () => {
  const randomQuestions = [];

  Object.entries(UNITWEIGHTAGE).forEach(([subjectName, unitWeightage]) => {
    // Find the subject with the same name as the current subjectName
    const subjectWithUnit = UPDATED_SYLLABUS.subjects.find(
      (subject) => subject.name === subjectName
    );

    if (!subjectWithUnit) return;

    // Iterate through the unitWeightage for the current subject
    Object.entries(unitWeightage).forEach(([mergedunit, numQuestions]) => {
      const unitInfo = subjectWithUnit.units.find(
        (unit) => unit.mergedunit === mergedunit
      );

      if (!unitInfo) return;

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
          answer: randomAnswerOption,
          explanation: `Explanation about the question from chapter ${randomTopic} of subject ${subjectName}`,
          subject: subjectName,
          chapter: randomTopic,
          mergedunit,
          difficulty: randomDifficulty,
          isadded: {
            state: false,
            by: "51ae7f08-9e06-41b7-a00c-5c4567a01a50",
          },
        };

        randomQuestions.push(newQuestion);
      }
    });
  });

  return randomQuestions;
};

const organizeQuestionsBySubject = async () => {
  try {
    const randomQuestions = generateRandomQuestions();

    // Step 1: Insert all questions into the Question model
    await Question.insertMany(randomQuestions);
    const allQuestions = await Question.find();
    // Create an object to store questions grouped by subject
    const questionsBySubject = {};

    // Group questions by subject
    allQuestions.forEach((question) => {
      const subject = question.subject;

      if (!questionsBySubject[subject]) {
        questionsBySubject[subject] = [];
      }

      questionsBySubject[subject].push({
        mergedunit: question.mergedunit,
        chapter: question.chapter,
        questionid: question._id,
      });
    });

    // Iterate through the subject models and insert the grouped questions
    const SubjectModels = [...new Set(allQuestions.map((q) => q.subject))];

    for (const model of SubjectModels) {
      const SubjectModel = getModelBasedOnSubject(model);
      const subjectQuestions = questionsBySubject[model];

      if (subjectQuestions && subjectQuestions.length > 0) {
        await SubjectModel.insertMany(subjectQuestions);
        console.log(`Questions for ${model} inserted successfully.`);
      }
    }

    console.log("Questions organized and inserted into subject collections.");
  } catch (error) {
    console.error("Error organizing and inserting questions:", error);
  }
};

// Call the function to organize and insert questions
// organizeQuestionsBySubject();

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

const groupQuestionsBySubject = async (questions) => {
  const questionarray = {};

  for (const subject of Object.keys(SUBJECTWEIGHTAGE)) {
    questionarray[subject] = questions.filter(
      (question) => question.subject === subject
    );
  }
  return questionarray;
};

router.post("/reviewquestion", VerifyAdmin, async (req, res) => {
  try {
    const reviewtype = req.query.reviewtype;
    const _id = req.body.questionElement._id;
    const questionElement = req.body.questionElement;
    const existingQuestion = await Question.findById(_id);
    if (!existingQuestion) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    // Check if subject or mergedunit has changed
    let oldsub = questionElement.subject,
      oldchapter = questionElement.chapter,
      oldmergedunit = questionElement.mergedunit;
    const subjectChanged = existingQuestion.subject !== questionElement.subject;
    if (subjectChanged) {
      oldsub = existingQuestion.subject;
    }
    const chapterChanged = existingQuestion.chapter !== questionElement.chapter;
    if (chapterChanged) {
      oldchapter = existingQuestion.chapter;
    }
    const mergedUnitChanged =
      existingQuestion.mergedunit !== questionElement.mergedunit;
    if (mergedUnitChanged) {
      oldmergedunit = existingQuestion.mergedunit;
    }

    // Update the existing question with new values
    existingQuestion.question = questionElement.question;
    existingQuestion.options = questionElement.options;
    existingQuestion.answer = questionElement.answer;
    existingQuestion.explanation = questionElement.explanation;
    existingQuestion.subject = questionElement.subject;
    existingQuestion.chapter = questionElement.chapter;
    existingQuestion.mergedunit = questionElement.mergedunit;
    existingQuestion.ispast = questionElement.ispast;
    existingQuestion.difficulty = questionElement.difficulty;
    existingQuestion.isverified = questionElement.isverified;
    existingQuestion.isadded.state = true;

    await existingQuestion.save();
    if (subjectChanged || chapterChanged || mergedUnitChanged) {
      const OldSubjectModel = getModelBasedOnSubject(oldsub);
      const oldmodelqn = await OldSubjectModel.findOne({
        questionid: new mongoose.Types.ObjectId(existingQuestion._id), // Assuming existingQuestion._id is already an ObjectId
        chapter: oldchapter,
        mergedunit: oldmergedunit,
      });
      await OldSubjectModel.deleteOne({
        questionid: new mongoose.Types.ObjectId(existingQuestion._id),
        chapter: oldchapter,
        mergedunit: oldmergedunit,
      });
    }

    const NewSubjectModel = getModelBasedOnSubject(questionElement.subject);
    const questionInModelNew = await NewSubjectModel.findOne({
      questionid: new mongoose.Types.ObjectId(existingQuestion._id), // Assuming existingQuestion._id is already an ObjectId
      chapter: existingQuestion.chapter,
      mergedunit: existingQuestion.mergedunit,
    });
    if (!questionInModelNew) {
      const newSubjectEntry = new NewSubjectModel({
        questionid: existingQuestion._id,
        chapter: questionElement.chapter, // Update to the new chapter
        mergedunit: existingQuestion.mergedunit,
      });
      await newSubjectEntry.save();
    }

    const elem = {
      _id: existingQuestion.id,
      userid:
        reviewtype === "reported"
          ? existingQuestion.isreported.by
          : existingQuestion.isadded.by,
      type: reviewtype,
    };
    return res.status(200).json({
      message: "Question updated successfully",
      elem,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/savequestion", VerifyUser, async (req, res) => {
  try {
    const {
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
    } = req.body.questionElement;
    const existingQuestion = new Question({
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

    const savedQuestion = await existingQuestion.save();
    const SubjectModel = getModelBasedOnSubject(subject);
    const questioninmodelnew = await SubjectModel.findOne({
      questionid: savedQuestion._id,
      chapter: savedQuestion.chapter,
      mergedunit: savedQuestion.mergedunit,
    });

    if (!questioninmodelnew) {
      const newSubjectEntry = new SubjectModel({
        questionid: savedQuestion._id,
        chapter: savedQuestion.chapter,
        mergedunit: savedQuestion.mergedunit,
      });
      await newSubjectEntry.save();
    }

    const elem = {
      questionid: savedQuestion._id,
      userid: savedQuestion.isadded.by,
    };
    return res.status(200).json({
      message: "question added successfully",
      elem,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/getreviewquestions", VerifyUser, async (req, res) => {
  try {
    const num = req.query.n;
    if (!req.query.n) {
      return res.status(400).json({
        message: "Missing parameter: number of questions",
      });
    }

    let questions = [];
    questions = await Question.aggregate([
      { $match: { "isadded.state": false, "isverified.state": false } },
      { $sample: { size: Number(num) } },
    ]).exec();
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
      message: "Questions fetched successfully",
      questions: formattedQuestions,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/getreportedquestions", VerifyAdmin, async (req, res) => {
  const num = req.query.n;
  const type = req.query.t;
  if (!req.query.n) {
    return res.status(400).json({
      message: "Missing parameter: number of questions",
    });
  }

  try {
    let questions = [];

    if (type === "reported") {
      questions = await Question.aggregate([
        { $match: { "isreported.state": true } },
        { $sample: { size: Number(num) } },
      ]).exec();
    } else if (type === "added") {
      questions = await Question.aggregate([
        { $match: { "isadded.state": false } },
        { $sample: { size: Number(num) } },
      ]).exec();
    } else {
      questions = await Question.aggregate([
        { $match: { "isadded.state": false, "isverified.state": false } },
        { $sample: { size: Number(num) } },
      ]).exec();
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
      questions: formattedQuestions,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/reportquestion", VerifyUser, async (req, res) => {
  try {
    const { message, questionid } = req.body;
    if (!message || !questionid) {
      return res.status(400).json({
        message: "Missing parameters",
      });
    }
    const userid = req.user.id;
    const question = await Question.findById(questionid);
    if (!question) {
      return res.status(404).json({
        message: "Question not found",
      });
    }
    question.isreported.state = true;
    question.isreported.by = userid;
    question.isreported.message = message;
    await question.save();
    return res.status(200).json({
      message: "Question reported successfully",
      _id: question._id,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/flagquestion", VerifyAdmin, async (req, res) => {
  try {
    const { message, questionid } = req.body;
    if (!message || !questionid) {
      return res.status(400).json({
        message: "Missing parameters",
      });
    }
    const userid = req.user.id;
    console.log("🚀 ~ file: questionroute.js:471 ~ router.post ~ userid:", userid)
    return res.send('jptt')
    const question = await Question.findById(questionid);
    if (!question) {
      return res.status(404).json({
        message: "Question not found",
      });
    }
    question.isflagged.state = true;
    question.isflagged.by = userid;
    question.isflagged.message = message;
    await question.save();
    return res.status(200).json({
      message: "Question Flagged successfully",
      _id: question._id,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/getqnbyid", VerifyUser, async (req, res) => {
  const id = req.query.i;
  const user = req.user;
  if (!id) {
    return res.status(400).json({
      message: "Missing parameter: question ID",
    });
  }
  try {
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        message: "Question not found",
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
      question: formattedQuestion,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/getqnsbyid", VerifyUser, async (req, res) => {
  const ids = req.body.ids;
  const rep_ids = req.body.rep_ids;
  const user = req.user;

  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({
      message: "Invalid or missing parameter: questions IDs",
    });
  }

  try {
    const questions = await Question.find({ _id: { $in: ids } }).select(
      "question _id isverified isreported"
    );

    let qn_added = [];
    let qn_reported = [];
    questions.forEach((question) => {
      if (question.isreported.state) {
        qn_reported.push({
          _id: question._id,
          question: question.question,
          isverified: question.isverified.state,
        });
      } else {
        qn_added.push({
          _id: question._id,
          question: question.question,
          isverified: question.isverified.state,
        });
      }
    });
    
    if (!questions || questions.length === 0) {
      return res.status(404).json({
        message: "Questions not found",
      });
    }

    return res.status(200).json({
      message: "Questions fetched successfully",
      qn_added,
      qn_reported,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

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

module.exports = router;

/* 


    if (!chap || !isTopicPresent(sub, chap)) {
      return res.status(400).json({
        message:
          "Invalid or missing chapter or chapter not found for the subject",
        status: 400,
      });
    }

*/
