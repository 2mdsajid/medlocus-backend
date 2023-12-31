const express = require("express");
const router = express.Router();
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
const { VerifyUser, VerifyAdmin } = require("../middlewares/middlewares");
const { limitermiddleware } = require("../middlewares/limiter");
const { checkCompatibility } = require("./addfile")

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
  const questionarray = {};

  for (const subject of Object.keys(SUBJECTWEIGHTAGE)) {
    questionarray[subject] = questions.filter(
      (question) => question.subject === subject
    );
  }
  return questionarray;
};

router.get(
  "/testquestions/:typeoftest",
  limitermiddleware,
  async (req, res) => {
    const { model, num, sub, chap, unit, userid } = req.query;
    const { typeoftest } = req.params;
    const numberofquestions = parseInt(num);

    let testid = req.query.testid;
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
        // make sure to revise the chapter
        // chapter coming with ( ) replaced by (-)
        // syllabus has ( ) & database has (-)
        // so matching from the syllabus removing the (-) with ( )
        if (!chap || !units.topics.includes(chap.replace(/-/g, " "))) {
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
      const groupedQuestions = await groupQuestionsBySubject(questions);
      return res.status(200).json({
        message: "Chapter questions founddddd",
        questions: groupedQuestions,
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
        {
          $match: {
            subject: sub,
            mergedunit: unit,
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
      const fraction = 100 / 200;
      const subjectKeys = Object.keys(SUBJECTWEIGHTAGE);
      const questions = [];

      for (const subject of subjectKeys) {
        const SubjectModel = getModelBasedOnSubject(subject);
        const numberOfQuestions = Math.ceil(
          SUBJECTWEIGHTAGE[subject] * fraction
        );
        const totalQuestionsInModel = await SubjectModel.countDocuments();

        const questionsToFetch = Math.min(
          numberOfQuestions,
          totalQuestionsInModel
        );
        const selectedquestions = await Question.aggregate([
          {
            $match: {
              subject: subject,
              "isverified.state": true,
              "isadded.state": true,
              "isreported.state": false,
              "isflagged.state": false,
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

      const typeofquestions = test.questiontype;
      let questions;
      if (typeofquestions === 'withid') {
        const test = await CustomTest.findOne({ testid: testid, type: typeoftest })
          .populate({
            path: 'questionsIds',
            select: '_id question options answer explanation subject chapter mergedunit',
          })
          .exec();
        const ungroupedQuestions = test.questionsIds
        questions = await groupQuestionsBySubject(ungroupedQuestions);

      } else if (typeofquestions === 'withoutid') {
        questions = test.questions;
      }
      return res.status(200).json({ questions });
    }
  }
);

router.get("/createdailytest", async (req, res) => {
  try {
    let questionsArray = [];
    const testid = createTodayDateId();

    const type = req.query.t
    if (!['dailytest'].includes(type)) {
      return res.status(404).send({ message: "unknown type" })
    }

    const existingCustomTest = await CustomTest.findOne({ testid, type });
    if (existingCustomTest) {
      return res.status(400).json({ message: "Test with the same name already exists." });
    }

    // Iterate through the UNITWEIGHTAGE object
    for (const category in UNITWEIGHTAGE) {
      for (const unit in UNITWEIGHTAGE[category]) {
        const weightage = UNITWEIGHTAGE[category][unit];
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
      type: 'dailytest',
      testid: testid,
      questionsIds: idArray,
      questiontype: 'withid',
    });
    await customTest.save();
    return res.status(200).json({
      message: "Daily test created successfully",
      dailytest: idArray.length,
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

router.post('/create-prayash', VerifyUser, async (req, res) => {
  try {
    const { name, type, questiontype, questions } = req.body;
    const formattedName = name.replace(/\s+/g, '-');
    const testid = formattedName

    const existingCustomTest = await CustomTest.findOne({ testid, type });

    if (existingCustomTest) {
      return res.status(400).json({ message: "Test Series with the same name already exists." });
    }

    if (questiontype === 'withoutid') {
      const customTest = new CustomTest({
        type: type,
        testid: testid,
        questions: questions,
        questiontype: questiontype,
        isSponsored: {
          by: formattedName,
        },
      });
      await customTest.save();

    }

    if (questiontype === 'withid') {
      const customTest = new CustomTest({
        type: type,
        testid: testid,
        questionsIds: questions,
        questiontype: questiontype,
        isSponsored: {
          by: formattedName,
        },
      });
      await customTest.save();

    }


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
