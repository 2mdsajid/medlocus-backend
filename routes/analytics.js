const express = require("express");
const router = express.Router();

const DailyTest = require("../schema/dailytest");
const Question = require("../schema/question");
const Admin = require("../schema/admin");
const User = require("../schema/user");
const Organization = require("../schema/organization");
const Analytic = require("../schema/analytic");
const CustomTest = require("../schema/customtests");

const { VerifyUser, VerifyAdmin } = require("../middlewares/middlewares");
const { getAllChaptersArray, getChaptersBySubject } = require("../public/new-syllabus");

router.get("/analytics", VerifyAdmin, async (req, res) => {
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
    const { typeoftest, testid, chapter_scores, combined_score, incorrectAttempt, score_card, questions_ids_and_scores } = req.body;
    const userId = req.userId;

    let analytic = await Analytic.findOne({ userid: userId });
    if (!analytic) {
      analytic = new Analytic({ userid: userId, chapterscores: [{}] });
      const user = await User.findOne({ _id: userId });
      if (!user.analytic) {
        user.analytic = analytic._id
        await user.save();
      }
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

    // storing custom test
    let questionModel = 'Question'
    const existingTest = await CustomTest.findOne({
      typeoftest,
      testid
    })
    if (existingTest) existingTest.usersattended.push(score_card)

    // INCORRECT AND OTHER TESTS DATA -- FOR PAID USERS ONLY
    const user = req.user
    const currentDateTime = new Date();
    const paymentExpireDateTime = new Date(user.payment.expireAt);
    if (user.payment.isPaid && (currentDateTime < paymentExpireDateTime)) {
      // storing incorrect questions ids
      const newIncorrectAttempts = incorrectAttempt.filter(id => !analytic.incorrect.includes(id));
      analytic.incorrect.push(...newIncorrectAttempts);

      // saving custom tests for re-attempts
      if (existingTest) {
        analytic.tests.push({
          test: existingTest._id,
          ...combined_score,
        })
      }

      // saving last 7 days tests -- not for past papers || fro now
      if (!existingTest || existingTest.type !== 'pastpapers') {
        questionModel = existingTest ? existingTest.questionmodel : 'Question'
        analytic.weektests.push({
          name: testid || typeoftest,
          questionsModel: questionModel,
          questions: questions_ids_and_scores,
        })
      }
    }

    if (existingTest) await existingTest.save()
    await analytic.save();
    return res.status(200).json({ message: 'Chapter scores updated successfully.' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// this is an open route for everyone, user or non user
router.post('/add-to-leaderboard', async (req, res) => {
  try {
    const { typeoftest, testid, score_card } = req.body;
    if (!testid || !typeoftest || !score_card) {
      return res.status(404).json({ message: 'Unable to add to leaderboard' });
    }
    const existingTest = await CustomTest.findOne({
      typeoftest,
      testid
    })
    if (!existingTest) {
      return res.status(404).json({ message: 'unable to find test' });
    }
    existingTest.usersattended.push(score_card)
    await existingTest.save()
    return res.status(200).json({ message: 'added successgully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });

  }
})

// get users for anaytics
router.get("/get-stats", VerifyAdmin, async (req, res) => {
  try {
    const targetUsersForThisSession = 669
    const Users = await User.find()
      .select('_id name email image role payment')

    const allUsers = Users.map(user => ({
      _id: user._id.toString(),
      name: user.name,
      email: user.email || null,
      image: user.image || null,
      role: user.role,
      status: user.payment ? user.payment.isPaid : false,
    }));

    // Get the current date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch users created today from the database
    const usersToday = await User.find({ createdAt: { $gte: today } });
    const totalUsersToday = usersToday.length;

    // Group users by date and count the number of users for each date
    // const usersByDate = allUsers.reduce((acc, user) => {
    //   const userDate = user.createdAt.toISOString().split('T')[0]; // Extracting the date part
    //   acc[userDate] = (acc[userDate] || 0) + 1;
    //   return acc;
    // }, {});

    // const usersPerDayData = Object.entries(usersByDate).map(([date, numberOfUsers]) => ({
    //   date,
    //   'Number Of Users': numberOfUsers,
    // }));

    const organizations = await Organization.find()
      .populate({
        path: 'createdBy',
        select: 'name',
      })
      .select('_id name createdBy users payment')
      .exec()
    const allOrgs = organizations.map(org => ({
      _id: org._id,
      name: org.name,
      createdBy: org.createdBy.name,
      users: org.users.length,
      status: org.payment.isPaid,
    }));

    return res.status(201).json({
      allUsers,
      allOrgs,
      totalUsersToday,
      targetUsersForThisSession
    });

  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
})

// get leader board to display in homepage
router.get("/get-home-stats", async (req, res) => {
  try {
    const analytics = await Analytic.find().populate('userid', 'name image');

    // Check if there are any analytics
    if (analytics.length === 0) {
      return res.status(404).json({ message: 'No data found in the Analytic collection' });
    }

    // Step 2: Calculate total t and total c for each chapterscores[0]
    const allTimeLeaderboardData = analytics.map(analytic => {
      const chapterscores = analytic.chapterscores[0];

      const totalCorrect = Object.values(chapterscores).reduce((sum, chapterData) => {
        return sum + chapterData.reduce((chapterSum, entry) => chapterSum + entry.c, 0);
      }, 0);

      const totalTotal = Object.values(chapterscores).reduce((sum, chapterData) => {
        return sum + chapterData.reduce((chapterSum, entry) => chapterSum + entry.t, 0);
      }, 0);

      const score = ((totalCorrect / totalTotal) * 100).toFixed(2);

      return {
        name: (analytic.userid && analytic.userid.name) ? analytic.userid.name : 'unknown',
        image: analytic.userid.image,
        // correct: totalCorrect,
        // total: totalTotal,
        score: isNaN(score) ? 0 : score, // To handle division by zero scenarios
      };
    });

    // Sort the array based on the score in descending order
    const sortedLeaderboardData = allTimeLeaderboardData.sort((a, b) => b.score - a.score);
    const top3LeaderboardData = sortedLeaderboardData.slice(0, 3);

    return res.status(200).json(top3LeaderboardData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// get total tests attempted board
router.get("/get-totaltests-leaderboard", async (req, res) => {
  try {
    const analytics = await Analytic.find().populate('userid', ['name', 'image']);

    // Check if there are any analytics
    if (analytics.length === 0) {
      return res.status(404).json({ message: 'No data found in the Analytic collection' });
    }

    // Calculate total tests attempted by each user
    const totalTestsLeaderboardData = analytics.map(analytic => {
      const totalTests = analytic.chapterscores.reduce((total, chapter) => {
        return total + Object.keys(chapter).length;
      }, 0);

      return {
        name: (analytic.userid && analytic.userid.name) ? analytic.userid.name : 'unknown',
        image: (analytic.userid && analytic.userid.image) ? analytic.userid.image : 'default-image-url',
        tests: totalTests,
      };
    });

    // Sort the array based on the total tests in descending order
    const sortedTotalTestsLeaderboardData = totalTestsLeaderboardData.sort((a, b) => b.tests - a.tests);
    const top3LeaderboardData = sortedTotalTestsLeaderboardData.slice(0, 3);

    return res.status(200).json(top3LeaderboardData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// get chapters recommendations for home page
router.get('/chapters-recommendations', VerifyUser, async function (req, res) {
  const userid = req.userId;
  const allChaptersBySubject = getChaptersBySubject()

  try {
    const userAnalytics = await Analytic.findOne({ userid: userid });
    if (!userAnalytics) {
      const subjectForChapter = allChaptersBySubject
      const finalRecommendations = {};
      for (const subject in allChaptersBySubject) {
        finalRecommendations[subject] = subjectForChapter[subject].slice(0, 1);
      }
      return res.status(404).json(finalRecommendations)
    }

    const firstChapterscore = userAnalytics.chapterscores[0];
    const attemptedChapters = Object.keys(firstChapterscore);
    const allChapters = await Question.distinct('chapter');
    const unAttemptedChapters = allChapters.filter(chapter => !attemptedChapters.includes(chapter));

    const subjectForChapter = {};
    /* 
    subject : [
      'chapter1', 'chapter2', 'chapter3
    ]
    */
    for (const subject in allChaptersBySubject) {
      const allChaptersOfThisSubject = allChaptersBySubject[subject];
      const subjectChapters = [];

      unAttemptedChapters.forEach((chapter) => {
        if (allChaptersOfThisSubject.includes(chapter)) {
          subjectChapters.push(chapter);
        }
      });

      if (subjectChapters.length > 0) {
        subjectForChapter[subject] = subjectChapters;
      }
    }

    // Get at least 3 chapters for each subject
    const finalRecommendations = {};
    for (const subject in subjectForChapter) {
      finalRecommendations[subject] = subjectForChapter[subject].slice(0, 1);
    }
    return res.json(finalRecommendations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;
