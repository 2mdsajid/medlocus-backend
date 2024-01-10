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
const User = require("../schema/user");
const Analytic = require("../schema/analytic");
const CustomTest = require("../schema/customtests");

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

router.post('/update-test', VerifyUser, async (req, res) => {
  try {
    const { typeoftest, testid, chapter_scores, combined_score, incorrectAttempt } = req.body;
    const userId = req.userId;

    let analytic = await Analytic.findOne({ userid: userId });

    if (!analytic) {
      analytic = new Analytic({ userid: userId, chapterscores: [{}] });
      const user = await User.findOne({ userid: userId });
      user.analytic = analytic._id
      await user.save();
    }

    // SAVING THE CHAPTERWISE ANALYTICS -- EVERY USERS
    let old_scores = analytic.chapterscores
    for (const chapterName of Object.keys(chapter_scores)) {
      if (!old_scores[0][chapterName]) {
        old_scores[0][chapterName] = [];
      }
      old_scores[0][chapterName].push(chapter_scores[chapterName]);
    }
    analytic.chapterscores[0] = old_scores[0]

    // INCORRECT AND OTHER TESTS DATA -- FOR PAID USERS ONLY
    const user = req.user
    if (user.payment.isPaid) {
      // storing incorrect questions ids
      const newIncorrectAttempts = incorrectAttempt.filter(id => !analytic.incorrect.includes(id));
      analytic.incorrect.push(...newIncorrectAttempts);

      // storing custom test
      const existingTest = await CustomTest.findOne({
        typeoftest,
        testid
      })
      if (existingTest) {
        analytic.tests.push({
          test: existingTest._id,
          ...combined_score,
        })
      }

    }

    await analytic.save();
    return res.status(200).json({ message: 'Chapter scores updated successfully.' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});




module.exports = router;
