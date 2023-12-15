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

function isTodayAfterDecember16() {
  const today = new Date();
  const december16 = new Date(today.getFullYear(), 11, 15); // Month is 0-indexed, so 11 represents December
  return today < december16;
}

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
    const { model, num, sub, chap, unit, testid } = req.query;
    const { typeoftest } = req.params;
    const numberofquestions = parseInt(num);
    const isDateOld = isTodayAfterDecember16()
    // const TEST_TYPES = [
    //   "chapterwise",
    //   "unitwise",
    //   "subjectwise",
    //   "modeltest",
    //   "dailytest",
    //   "weeklytest",
    //   "sujectwiseseries",
    //   "prayash",
    // ];

    // if (!TEST_TYPES.includes(typeoftest)) {
    //   return res.status(400).json({
    //     message: "Missing some parameters",
    //   });
    // }

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
          { $sample: { size: questionsToFetch } },
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
    // /* DAILY TEST---------------------------- */
    else if (typeoftest === "dailytest") {
      const dateid = testid ? testid : createTodayDateId();
      const testquestions = await DailyTest.findOne({
        type: "dailytest",
        dateid: dateid,
        archive: false,
      })
        .populate({
          path: 'questions',
          select: '_id question options answer explanation subject chapter mergedunit',
        })
      if (!testquestions) {
        return res.status(404).json({
          message: " test not found",
        });
      }

      const modifiedquestions = await testquestions.map((question) => ({
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

    // FOR PRAYASH PREVIOUS TESTS
    else if (typeoftest === "prayash" && isDateOld) {
      try {
        if (!testid) {
          return res.status(404).json({
            message: "oops! date mismatched !",
          });
        }

        const test = await SpecialSeries.findOne({
          type: "prayash",
          dateid: testid,
        });
        if (!test) {
          return res.status(404).json({
            message: "Daily test not found",
          });
        }

        return res.status(200).json({
          message: "Test retrieved successfully",
          questions: test.questions,
        });
      } catch (error) { }
    }

    // fetch tests by their ids -- incase the above did not work
    else {
      if (!testid) {
        return res.status(400).json({
          message: "PLease you are forgetting a type",
        });
      }

      const test = await CustomTest.findOne({ testid });
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }

      if (typeoftest !== test.type) {
        return res.status(404).json({ message: "Test not found" });
      }

      const typeofquestions = test.questiontype;
      let questions;
      if (typeofquestions === 'withid') {
        const test = await CustomTest.findOne({ testid })
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
    const { t } = req.query;
    if (!t || !["dailytest"].includes(t)) {
      return res.status(400).json({
        message: "PLease you are forgetting a type",
      });
    }
    let questionsArray = [];
    const dateid = createTodayDateId();
    // if (t === "daily") {
    //   const existingdate = await DailyTest.findOne({
    //     dateid: dateid,
    //   });
    //   if (existingdate) {
    //     return res.status(301).json({
    //       message: "Daily Test Already exist",
    //     });
    //   }
    // }
    // Initialize a counter to keep track of how many questions have been fetched
    let fetchedQuestionsCount = 0;

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
        questions.length === 0 && console.log(unit, questions.length);
      }
    }

    const newArray = [];
    questionsArray.forEach((questionId, index) => {
      newArray.push({
        question: questionId,
      });
    });
    const dailytest = new DailyTest({
      dateid: dateid,
      questions: newArray,
    });
    await dailytest.save();

    // const savedtest = await dailytest.save();
    return res.status(200).json({
      message: "Daily test created successfully",
      dailytest: newArray.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/fetchcustomtests", async (req, res) => {
  const { testid } = req.query;
  if (!testid) {
    return res.status(400).json({
      message: "PLease you are forgetting a type",
    });
  }

  const test = await CustomTest.findOne({ testid });
  if (!test) {
    return res.status(404).json({ error: "Test not found" });
  }

  const typeofquestions = test.questiontype;
  let questions;
  if (typeofquestions === 'withid') {
    const test = await CustomTest.findOne({ testid })
      .populate({
        path: 'questionsIds',
        select: '_id question options answer explanation subject chapter mergedunit',
      })
      .exec();

    questions = test.questionsIds
  } else if (typeofquestions === 'withoutid') {
    questions = test.questions;
  }

  res.status(200).json({ questions });

})


router.post('/create-prayash', VerifyUser, async (req, res) => {
  try {
    const { name, type, questiontype, questions } = req.body;
    const formattedName = name.replace(/\s+/g, '-');
    const testid = formattedName + '-' + createTodayDateId();

    const existingCustomTest = await CustomTest.findOne({ testid });

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
    const dailytest = await DailyTest.findOne({ dateid });
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
router.get("/getdailytests", VerifyUser, async (req, res) => {
  try {
    const { id, t } = req.query;
    if (id) {
      let dailytest;
      if (t === "sujectwiseseries") {
        dailytest = await SpecialSeries.findOne({ _id: id }).lean();
        usersattend = dailytest.usersattended;
        usersattend.sort((a, b) => b.totalscore - a.totalscore);

        // Add rank to each user based on the sorted order
        dailytest.usersattended = await usersattend.map((user, index) => ({
          ...user,
          ["rank"]: index + 1,
        }));

        const newquestions = [].concat(...Object.values(dailytest.questions));
        dailytest.questions = newquestions;

        return res.status(200).json({
          message: "Tests fetched",
          test: dailytest,
        });
      } else {
        dailytest = await DailyTest.findOne({ _id: id })
          .populate({
            path: "questions.question",
            model: Question,
            select: "question options answer _id explanation",
          })
          .sort({ date: -1 })
          .limit(4)
          .lean();
        if (!dailytest) {
          return res.status(400).json({
            message: "cant find test",
          });
        }
        const questions = await dailytest.questions.map((question) => {
          return question.question;
        });
        dailytest.usersattended = dailytest.usersattended
          .sort((a, b) => Number(b.totalscore) - Number(a.totalscore))
          .map((user, index) => ({ ...user, rank: index + 1 }));
        dailytest.questions = questions;
        return res.status(200).json({
          message: "Tests fetched",
          test: dailytest,
        });
      }
    }

    const special = await SpecialSeries.find({ archive: true }).select(
      "_id dateid type"
    );
    const dailytests = await DailyTest.find({ archive: true }).select(
      "_id dateid type"
    );
    if (!dailytests) {
      return res.status(400).json({
        message: "cant find tests",
      });
    }
    return res.status(200).json({
      message: "Tests fetched",
      tests: [...dailytests, ...special],
    });
  } catch (error) { }
});

router.get("/addusertotest", async (req, res) => {
  const userid = req.query.userid;
  const t = req.query.t;
  const dateid = createTodayDateId();
  let test;
  t === "sujectwiseseries"
    ? (test = await SpecialSeries.findOne({
      type: t,
      dateid: dateid,
    }))
    : (test = await DailyTest.findOne({
      type: t,
      dateid: dateid,
    }));

  if (!test) {
    return res.status(400).json({
      message: "cant find test",
    });
  }

  const userExists = test.usersattended.some((user) => user.userid === userid);
  if (userExists) {
    return res.status(400).json({
      message: "You Have Already attended the test",
    });
  }

  test.usersconnected.push(userid);
  const savedest = await test.save();

  return res.status(200).json({
    message: "saved connecteduser",
  });
});

router.post("/addusertotest", async (req, res) => {
  const dateid = createTodayDateId();
  const t = req.query.t;
  const prayash_testid = req.query.prayash_testid;
  const { userid, name, score, email } = req.body;
  if (!userid) {
    return res.status(400).json({
      message: "no userid or name provided",
    });
  }
  let test;
  t === "prayash"
    ? (test = await SpecialSeries.findOne({
      type: t,
      dateid: prayash_testid,
    }))
    : (test = await DailyTest.findOne({
      type: t,
      dateid: dateid,
    }));

  if (!test || test.archive === true) {
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
      <p style="font-size: 16px; margin: 0;">Test ID: ${dateid}</p>
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
