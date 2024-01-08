const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const {
  UNITWEIGHTAGE,
  SUBJECTWEIGHTAGE,
  UPDATED_SYLLABUS,
  data_series_subjectwise,
} = require("../public/syllabus.js");
const DailyTest = require("../schema/dailytest");
const SpecialSeries = require("../schema/specialseries");
const CustomTest = require("../schema/customtests");
const Question = require("../schema/question");
const OutQuestion = require("../schema/outquestion");
const { VerifyUser, VerifyAdmin } = require("../middlewares/middlewares");
const { limitermiddleware } = require("../middlewares/limiter");
const { checkCompatibility } = require("./addfile")
const Organization = require("../schema/organization");
const Analytic = require("../schema/analytic");
const { getModelBasedOnSubject } = require('../public/utils.js')

const { sendEmail, LOGO_URL } = require("./gmailroute");
const createTodayDateId = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Month is zero-based
  const day = String(currentDate.getDate()).padStart(2, "0");
  const dateid = `${year}-${month}-${day}`;
  return dateid;
};

const groupQuestionsBySubject = async (questions) => {
  const questionArray = {};
  for (const question of questions) {
    const subject = question.subject || 'combined';
    if (!questionArray[subject]) {
      questionArray[subject] = [];
    }
    questionArray[subject].push(question);
  }
  return questionArray;
};


router.get(
  "/testquestions/:typeoftest",
  limitermiddleware,
  async (req, res) => {
    const { model, num, sub, chap, unit, userid } = req.query;
    const { typeoftest } = req.params;
    const numberofquestions = parseInt(num);

    let testid = req.query.testid !== 'undefined' ? req.query.testid : null;

    if (typeoftest === 'dailytest') {
      testid = createTodayDateId();
    }

    const FIXED_TESTS = [
      "chapterwise",
      "unitwise",
      "subjectwise",
    ];

    if (!typeoftest) {
      return res.status(400).json({
        message: "Missing some parameters",
      });
    }


    if (["chapterwise", "unitwise", "subjectwise"].includes(typeoftest)) {
      if (numberofquestions > 30) {
        return res.status(400).json({
          message: "Number of questions can't be more than 30",
        });
      }
      if (numberofquestions < 5) {
        return res.status(400).json({
          message: "Number of questions can't be less",
        });
      }

      if (!sub || !(sub in SUBJECTWEIGHTAGE)) {
        return res.status(400).json({
          message: "Invalid or missing subject",
        });
      }

      if (typeoftest === "unitwise") {
        if (!unit || !(unit in UNITWEIGHTAGE[sub])) {
          return res.status(400).json({
            message: "Invalid or missing unit",
          });
        }
      }

      if (typeoftest === "chapterwise") {
        // make sure to revise the chapter
        // chapter coming with ( ) replaced by (-)
        // syllabus has ( ) & database has (-)
        // so matching from the syllabus removing the (-) with ( )
        if (!chap) {
          return res.status(400).json({
            message: "Invalid or missing chapter",
          });
        }
      }

      if (
        !numberofquestions ||
        numberofquestions > 50 ||
        numberofquestions < 5
      ) {
        return res.status(400).json({
          message: "Number of questions must be in range 5 - 50",
        });
      }
    }

    // /* SUBJECTWISE TEST ----------------------------------------- */
    if (typeoftest === "subjectwise") {
      const questions = await Question.aggregate([
        {
          $match: {
            subject: sub,
            "isverified.state": true,
            "isadded.state": true,
            "isreported.state": false,
            "isflagged.state": false,
          },
        },
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
      // const groupedQuestions = await groupQuestionsBySubject(questions);
      return res.status(200).json({
        message: "Chapter questions founddddd",
        questions: questions,
      });
    }
    ///* UNIT WISE */-------------------------------
    else if (typeoftest === "unitwise") {
      const questions = await Question.aggregate([
        {
          $match: {
            subject: sub,
            mergedunit: unit,
            "isverified.state": true,
            "isadded.state": true,
            "isreported.state": false,
            "isflagged.state": false,
          },
        },
        { $sample: { size: numberofquestions } },
        {
          $project: {
            question: 1,
            options: 1,
            answer: 1,
            explanation: 1,
            subject: 1,
            chapter: 1,
            images: 1,
            _id: 1,
          },
        },
      ]).exec();
      if (questions.length === 0) {
        return res.status(400).json({
          message: "No questions found",
        });
      }
      return res.status(200).json({
        message: "unit questions founddddd",
        questions: questions,
      });
    }
    // /* CHAPTERWISE------------------------------------------------------ */
    else if (typeoftest === "chapterwise") {
      const questions = await Question.aggregate([
        {
          $match: {
            subject: sub,
            chapter: chap,
            "isverified.state": true,
            "isadded.state": true,
            "isreported.state": false,
            "isflagged.state": false,
          },
        },
        { $sample: { size: numberofquestions } },
        {
          $project: {
            question: 1,
            options: 1,
            answer: 1,
            explanation: 1,
            subject: 1,
            chapter: 1,
            images: 1,
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
      return res.status(200).json({
        message: "unit questions founddddd",
        questions: questions,
      });
    }
    // /* MODEL TEST ---------------------------------- */
    else if (typeoftest === "modeltest" && [50, 100, 150, 200].includes(numberofquestions)) {
      const fraction = numberofquestions / 200;
      const subjectKeys = Object.keys(SUBJECTWEIGHTAGE);
      const questions = [];
      for (const subject of subjectKeys) {
        const selectedquestions = await Question.aggregate([
          {
            $match: {
              subject: subject,
            },
          },
          { $sample: { size: SUBJECTWEIGHTAGE[subject] * fraction } },
          {
            $project: {
              question: 1,
              options: 1,
              answer: 1,
              explanation: 1,
              subject: 1,
              chapter: 1,
              images: 1,
              _id: 1,
            },
          },
        ]).exec();
        questions.push(...selectedquestions);
      }
      return res.status(200).json({questions});
    }

    // fetch tests by their ids -- incase the above did not work
    else {
      if (!testid) {
        return res.status(400).json({
          message: "undefined testid",
        });
      }

      // for daily tests only -- to get current date from server not from client -- timezones may vary
      const test = await CustomTest.findOne({ testid: testid, type: typeoftest });
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }

      const userExists = test.usersattended.some((user) => user.userid === userid);
      if (userExists) {
        return res.status(400).json({
          message: "You Have Already Attended This Test",
        });
      }

      test.usersconnected.push(userid);
      const savedest = await test.save();

      const questionmodel = test.questionmodel;
      let questions;

      const test2 = await CustomTest.findOne({ testid: testid, type: typeoftest })
        .populate({
          path: 'questionsIds',
          model: questionmodel,
          select: '_id question options answer explanation subject chapter mergedunit',
        })
        .exec();
      const ungroupedQuestions = test2.questionsIds
      questions = await groupQuestionsBySubject(ungroupedQuestions);

      return res.status(200).json({ questions });
    }
  }
);

// create daily and weekly tests -- for cron jobs
router.get("/createdailytest", async (req, res) => {
  try {
    let questionsArray = [];
    const testid = createTodayDateId();

    const type = req.query.t
    if (!['dailytest', 'weeklytest'].includes(type)) {
      return res.status(404).send({ message: "unknown type" })
    }

    const existingCustomTest = await CustomTest.findOne({ testid, type });
    if (existingCustomTest) {
      return res.status(400).json({ message: "Test with the same name already exists." });
    }

    for (const category in UNITWEIGHTAGE) {
      if (type === 'dailytest') {
        // to fetch 10 questions from eaxh subject, as units failed 
        const questions = await Question.aggregate([
          {
            $match: {
              subject: category,
              "isverified.state": true,
              "isadded.state": true,
              "isreported.state": false,
              "isflagged.state": false,
            },
          },
          { $sample: { size: 10 } },
          {
            $project: {
              _id: 1,
            },
          },
        ]).exec();
        questionsArray.push(...questions);
      } else {
        // to get from each unit for 200 questions
        for (const unit in UNITWEIGHTAGE[category]) {
          const weightage = UNITWEIGHTAGE[category][unit]
          const questions = await Question.aggregate([
            {
              $match: {
                mergedunit: unit,
                "isverified.state": true,
                "isadded.state": true,
                "isreported.state": false,
                "isflagged.state": false,
              },
            },
            { $sample: { size: weightage } },
            {
              $project: {
                _id: 1,
              },
            },
          ]).exec();
          questionsArray.push(...questions);
          questions.length === 0 && console.log(unit, questions.length); //console the unit with zero questions fetched
        }
      }
    }
    const idArray = questionsArray.map(question => question._id);

    const customTest = new CustomTest({
      name: type === 'dailytest' ? 'Daily Test' : 'Weekly Test',
      type: type,
      testid: testid,
      questionmodel: 'Question',
      questionsIds: idArray,
      creator: {
        model: 'User',
        by: '659a346539a27408c615e708', //replace by the userid of medlocus account
      },
    });
    await customTest.save();
    return res.status(200).json({
      message: type + " created successfully",
      dailytest: idArray.length,
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});
// create custom model tests tests -- 
router.post("/create-custom-modeltest", async (req, res) => {
  try {
    const { name, type, num } = req.body;

    let questionsArray = [];
    const formattedName = name.replace(/\s+/g, '-');
    const testid = formattedName

    if (!num || !['100','200'].includes(num)) {
      return res.status(404).send({ message: 'number can be either 100 or 200' });
    }

    const fraction = parseInt(num) / 200
    const existingCustomTest = await CustomTest.findOne({ testid, type });
    if (existingCustomTest) {
      return res.status(400).json({ message: "Test Series with the same name already exists." });
    }


    for (const category in UNITWEIGHTAGE) {
      for (const unit in UNITWEIGHTAGE[category]) {
        const weightage = UNITWEIGHTAGE[category][unit]*fraction
        const questions = await Question.aggregate([
          {
            $match: {
              mergedunit: unit,
              "isverified.state": true,
              "isadded.state": true,
              "isreported.state": false,
              "isflagged.state": false,
            },
          },
          { $sample: { size: weightage } },
          {
            $project: {
              _id: 1,
            },
          },
        ]).exec();
        questionsArray.push(...questions);
        questions.length === 0 && console.log(unit, questions.length); //console the unit with zero questions fetched
      }
    }
    const idArray = questionsArray.map(question => question._id);

    const customTest = new CustomTest({
      name: name,
      type: type,
      testid: testid,
      questionmodel: 'Question',
      questionsIds: idArray,
      creator: {
        model: 'User',
        by: '659a346539a27408c615e708', //replace by the userid of medlocus account
      },
    });

    await customTest.save();
    return res.status(200).json({
      message: type + " created successfully",
      testid: testid,
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

router.post('/create-test', VerifyUser, async (req, res) => {
  try {
    const { name, type, questiontype, questions } = req.body;
    const formattedName = name.replace(/\s+/g, '-');
    // const testid = formattedName + '-' + createTodayDateId();
    const testid = formattedName

    const existingCustomTest = await CustomTest.findOne({ testid, type });
    if (existingCustomTest) {
      return res.status(400).json({ message: "Test Series with the same name already exists." });
    }

    let question_ids = questions
    if (questiontype === 'withoutid') {
      const flattenedQuestions = [];
      for (const subject in questions) {
        const questionsForSubject = questions[subject];
        flattenedQuestions.push(
          ...questionsForSubject.map(question => ({
            ...question,
            _id: new mongoose.Types.ObjectId(),
            subject: subject.toLowerCase() // Assuming subject is the name in lowercase
          }))
        );
      }

      const questionIds = await Promise.all(
        flattenedQuestions.map(async (question) => {
          const newQuestion = new OutQuestion(question);
          await newQuestion.save();
          return newQuestion._id;
        })
      );
      question_ids = questionIds

    }

    const customTest = new CustomTest({
      type: type,
      testid: testid,
      questionsIds: question_ids,
      questionmodel: questiontype === 'withid' ? 'Question' : 'Outquestion',
      isSponsored: {
        by: formattedName,
      },
    });
    await customTest.save();


    return res.status(200).json({
      message: 'success',
      url: process.env.FRONTEND + '/tests?type=prayash&testid=' + testid
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal Server Error',
    });
  }
})

router.get("/invalidatedailytest", async (req, res) => {
  try {
    const dateid = createTodayDateId();

    const type = req.query.type
    if (!['dailytest'].includes(type)) {
      return res.status(404).send({ message: "unknown type" })
    }

    const dailytest = await CustomTest.findOne({ testid: dateid, type });
    if (!dailytest) {
      return res.status(200).json({
        message: "No Test Found",
      });
    }
    if (dailytest.archive === true) {
      return res.status(500).json({
        message: "Test Already Archived",
      });
    }
    dailytest.archive = true;
    const savedtest = await dailytest.save();
    return res.status(200).json({
      message: "Daily test archived successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/getdailytests",VerifyUser, async (req, res) => {
  try {
    const customTestsWithAttendees = await CustomTest.find({
      archive: true,
      usersattended: { $exists: true, $not: { $size: 0 } },
    }).select("_id testid date type");
    
    if (!customTestsWithAttendees || customTestsWithAttendees.length === 0) {
      return res.status(200).json({
        message: "No tests found with attendees",
      });
    }
    return res.status(200).json({
      message: "Tests fetched",
      tests: customTestsWithAttendees,
    });

  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
});

router.get("/getdailytests/:typeoftest",VerifyUser, async (req, res) => {
  try {
    const { typeoftest } = req.params;
    let testid = req.query.testid;
    // if (typeoftest === 'dailytest') {
    //   testid = createTodayDateId();
    // }

    if (!testid) {
      return res.status(400).json({
        message: "Undefined testid",
      });
    }

    // Retrieve the test
    let testQuery = { testid: testid, type: typeoftest };
    let test = await CustomTest.findOne(testQuery);
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }
    let testQuestions = test.questions

    const typeofquestions = test.questiontype;
    if (typeofquestions === 'withid') {
      test = await CustomTest.findOne(testQuery)
        .populate({
          path: 'questionsIds',
          select: '_id question options answer explanation subject chapter mergedunit',
        })
        .sort({ date: -1 })
        .limit(4)
        .exec();

      testQuestions = test.questionsIds;
    }

    if (typeofquestions === 'withoutid') {
      const { physics, chemistry, botany, zoology, mat } = test.questions
      testQuestions = [...zoology, ...botany, ...chemistry, ...physics, ...mat]
    }


    return res.status(200).json({
      message: "Test fetched",
      test,
      questions: testQuestions,
    });

  } catch (error) {
    console.error("Error in getdailytests route:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});


router.post("/addusertotest", async (req, res) => {
  const { typeoftest } = req.query;
  let testid = req.query.testid;
  // if (typeoftest === 'dailytest') {
  //   testid = createTodayDateId();
  // }

  if (!testid) {
    return res.status(400).json({
      message: "undefined testid",
    });
  }

  const { userid, name, score, email } = req.body;
  if (!userid) {
    return res.status(400).json({
      message: "no userid or name provided",
    });
  }

  let test = await CustomTest.findOne({ testid: testid, type: typeoftest })
  if (!test) {
    return res.status(400).json({
      message: "cant find test",
    });
  }

  const userExists = test.usersattended.some((user) => user.userid === userid);
  if (userExists) {
    return res.status(400).json({
      message: "Already attended the test",
    });
  }

  test.usersattended.push({
    userid,
    name,
    totalscore: score,
  });
  const savedest = await test.save();

  const subject = "Test Score";
  const html = `<div style="background-color: #F8FAFC; padding: 32px;max-width:40rem;margin"0 auto;">
  <div style="background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); padding: 32px; text-align: center;">
    <img src="${LOGO_URL}" alt="Your Logo" style="max-width: 150px; margin-bottom: 16px;">
    <h2 style="font-size: 28px; font-weight: bold; margin: 0 0 16px;">User Details</h2>
    <p style="font-size: 18px; margin-bottom: 16px;">Hello ${name},</p>
    <p style="font-size: 18px; margin-bottom: 16px;">Here are the user details:</p>
    <div style="background-color: #E0E0E0; padding: 12px; border-radius: 8px; margin: 16px 0;">
      <p style="font-size: 16px; margin: 0;"><strong>User ID:</strong> ${userid}</p>
    </div>
    <div style="background-color: #E0E0E0; padding: 12px; border-radius: 8px; margin: 16px 0;">
      <p style="font-size: 16px; margin: 0;"><strong>Name:</strong> ${decodeURI(
    name
  )}</p>
    </div>
    <div style="background-color: #E0E0E0; padding: 12px; border-radius: 8px; margin: 16px 0;">
      <p style="font-size: 16px; margin: 0;"><strong>Score:</strong> ${score}</p>
    </div>
    <div style="background-color: #3498db; color: #fff; padding: 10px; border-radius: 8px; margin: 16px 0;">
      <p style="font-size: 16px; margin: 0;">Test ID: ${testid}</p>
    </div>
    <a href="${process.env.FRONTEND
    }/result" style="color: #3498db; text-decoration: none; font-size: 16px; margin: 16px 0; display: block;">View Leaderboard and Answers</a>
    <p style="font-size: 18px; margin: 16px 0;">Thanks for attending the test. We encourage you to participate in other tests available in the Test section.</p>
    <p style="font-size: 18px; margin: 16px 0;">If you encounter any problems, feel free to discuss them in the Discussion section. You can also seek help and guidance from the toppers of previous tests.</p>
  </div>
</div>

`;
  const send_email = await sendEmail(subject, email, html);
  return res.status(200).json({
    message: "saved user score",
    savedest,
  });
});

// fetch custom tests
router.get('/get-custom-tests/:typeoftest', async (req, res) => {
  try {
    const { typeoftest } = req.params

    const customTests = await CustomTest.find({ type: typeoftest })
      .populate({
        path: "creator.by",
        model: "User",
        select: "name email"
      })
      .select('name testid creator.by questionsIds type date')
      .exec();

    if (customTests.length == 0) {
      return res.status(300).json({ message: 'No test available' })
    }

    const modifiedCustomTests = customTests.map(test => ({
      name: test.name,
      testid: test.testid,
      creator: {
        _id: test.creator._id,
        name: test.creator.by.name,
      },
      numberOfQuestions: test.questionsIds.length,
      type: test.type,
      date: test.date,
    }));

    return res.status(200).json(modifiedCustomTests)

  } catch (error) {
    console.error('Error retrieving chapters:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// fetch chapters for chapterwise tests
router.get('/get-chapters', async (req, res) => {
  try {
    const { sub } = req.query;
    if (!sub) {
      return res.status(400).json({ error: 'Subject not provided' });
    }
    const chapters = await Question.distinct('chapter', { subject: sub });
    const chapterCounts = {};
    for (const chapter of chapters) {
      const count = await Question.countDocuments({ subject: sub, chapter });
      chapterCounts[chapter] = count;
    }
    return res.json({ chapters, chapterCounts });
  } catch (error) {
    console.error('Error retrieving chapters:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
// get chapters and it number of questions
router.get('/get-subjects', async (req, res) => {
  try {
    const subjects = await Question.distinct('subject');
    const subjectsWithCount = {};

    for (const subject of subjects) {
      const count = await Question.countDocuments({ subject });
      subjectsWithCount[subject] = count;
    }
    console.log("🚀 ~ file: tests.js:715 ~ router.get ~ subjectsWithCount:", subjectsWithCount)
    return res.json(subjectsWithCount);
  } catch (error) {
    console.error('Error retrieving subjects with count:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
// fetch sets for pastpapers
router.get('/get-pastpapers', async (req, res) => {
  try {
    const pastYearSets = await CustomTest.find({ type: "pastpaper" })
      .populate({
        path: "creator.by",
        model: "User",
        select: "name email"
      })
      .select('name testid creator.by type')
      .exec();
    const categorizedSets = pastYearSets.reduce((acc, set) => {
      const [affiliation, year] = set.testid.split('-');
      if (!acc[affiliation]) {
        acc[affiliation] = [];
      }
      acc[affiliation].push({ ...set.toObject(), year });
      return acc;
    }, {});

    return res.status(200).json({ ...categorizedSets });


  } catch (error) {
    console.error('Error retrieving chapters:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.createTodayDateId = createTodayDateId;
module.exports = router;

// for (const subject in UNITWEIGHTAGE) {
//   if (UNITWEIGHTAGE.hasOwnProperty(subject)) {
//     const subjectModel = getModelBasedOnSubject(subject);
//     const unitWeightage = UNITWEIGHTAGE[subject];

//     for (const mergedunit in unitWeightage) {
//       if (unitWeightage.hasOwnProperty(mergedunit)) {
//         const numberOfQuestions = unitWeightage[mergedunit];

//         const randomQuestions = await subjectModel.aggregate([
//           { $match: { mergedunit: mergedunit } },
//           { $sample: { size: numberOfQuestions } },
//         ]);
//         finalquestions.push(...randomQuestions);
//       }
//     }
//   }
// }
// const questionsArray = finalquestions.map((questionid) => {
//   return {
//     question: questionid.questionid,
//   };
// });
// const dailytest = new DailyTest({
//   dateid: dateid,
//   questions: questionsArray,
// });
