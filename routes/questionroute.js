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
      isverified,
      images,
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
      isverified,
      images,
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
  const sub = req.query.sub;
  if (t === "subject" && !sub) {
    return res.status(400).json({
      message: "Missing parameter: subject",
    });
  }
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
    } else if (type === "subject") {
      questions = await Question.aggregate([
        {
          $match: {
            subject: sub,
          },
        },
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

router.post("/addexplanation", VerifyAdmin, async (req, res) => {
  try {
    const { explanation, questionid, difficulty, image } = req.body;
    if (!questionid || !explanation) {
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

    question.explanation = explanation;
    question.difficulty = difficulty[0] || "m";
    question.images.exp = image || "";
    await question.save();
    return res.status(200).json({
      message: "Explanation saved successfully",
      _id: question._id,
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
    if (question.isreported.state) {
      if (!question.isreported.by === userid) {
        return res.status(401).json({
          message: "Question already reported by someone",
        });
      }
    }
    question.isreported.state = true;
    question.isreported.by = userid;
    question.isreported.message = message;
    question.isverified.state = false;
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

router.post("/approvequestion", VerifyAdmin, async (req, res) => {
  try {
    const { questionid } = req.body;
    if (!questionid) {
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
    if (question.isverified.state === true) {
      return res.status(200).json({
        message: "Question Already Approved",
      });
    }
    question.isverified.state = true;
    question.isverified.by = userid;
    await question.save();
    return res.status(200).json({
      message: "Question Approved successfully",
      _id: question._id,
      addedby: question.isadded.by,
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
      images: question.images,
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

module.exports = router;
