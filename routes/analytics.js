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
const Admin = require("../schema/admin");

const { VerifyUser, VerifyAdmin } = require("../middlewares/middlewares");

router.get("/analytics", async (req, res) => {
  try {
    const totalQuestions = await Question.countDocuments();

    const verifiedQuestions = await Question.countDocuments({
      "isverified.state": true,
      "isadded.state": true,
      attempt: 1,
    });
    const reportedQuestions = await Question.countDocuments({
      "isreported.state": true,
    });

    const totalQuestionsBySubject = await Question.aggregate([
      {
        $group: {
          _id: "$subject",
          count: { $sum: 1 },
        },
      },
    ]);
    const totalQuestionsPerSubject = [];
    totalQuestionsBySubject.forEach((item) => {
      totalQuestionsPerSubject.push({
        name: item._id,
        "Number Of Questions": item.count,
      });
    });

    // Group questions by chapter and count them
    const questionsByChapter = await Question.aggregate([
      {
        $group: {
          _id: { subject: "$subject", chapter: "$chapter" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Transform the questionsByChapter data into the desired format
    const subjectWiseChapters = {};
    questionsByChapter.forEach((item) => {
      const { subject, chapter } = item._id;
      if (!subjectWiseChapters[subject]) {
        subjectWiseChapters[subject] = [];
      }
      subjectWiseChapters[subject].push({
        name: chapter,
        count: item.count,
      });
    });

    const uniqueMergedUnits = await Question.aggregate([
      {
        $group: {
          _id: { subject: "$subject", mergedunit: "$mergedunit" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Transform the uniqueMergedUnits data into the desired format
    const subjectWiseMergedUnits = {};
    uniqueMergedUnits.forEach((item) => {
      const { subject, mergedunit } = item._id;
      if (!subjectWiseMergedUnits[subject]) {
        subjectWiseMergedUnits[subject] = [];
      }
      subjectWiseMergedUnits[subject].push({
        name: mergedunit,
        count: item.count,
      });
    });

    const questionsByDateAdded = await Question.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$isadded.date" } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 }, // Sort in ascending order by date
      },
    ]);

    // Transform the questionsByDateAdded data into the desired format
    const questionsAddedByDate = [];
    questionsByDateAdded.forEach((item) => {
      questionsAddedByDate.push({
        name: item._id,
        "Number Of Questions": item.count,
      });
    });

    const modifiedadmins = [];
    const admins = await Admin.find().select("name questions questionsVerified");
    admins.forEach((admin) => {
      modifiedadmins.push({
        name: admin.name,
        "Number Of Questions": admin.questions,
        "Verified": admin.questionsVerified
      });
    });
    res.status(200).json({
      totalQuestions,
      verifiedQuestions,
      reportedQuestions,
      totalQuestionsPerSubject,
      subjectWiseChapters,
      subjectWiseMergedUnits,
      questionsAddedByDate,
      modifiedadmins,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while fetching analytics data." });
  }
});

module.exports = router;
