const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');

const CustomTest = require("../schema/customtests");
const Question = require("../schema/question");
const Outquestion = require("../schema/outquestion");
const PastQuestion = require("../schema/pastquestion");
const { VerifyUser, VerifyAdmin } = require("../middlewares/middlewares");
const { limitermiddleware } = require("../middlewares/limiter");
const Organization = require("../schema/organization");
const Analytic = require("../schema/analytic");
const { groupQuestionsBySubject, generateVerificationKey } = require('../public/utils.js')

const jwt = require("jsonwebtoken");


const { sendEmail, LOGO_URL } = require("./gmailroute");

// getting from syllabus methods
const { getSubjectWeightage, getUnitsWeightage, getUnitsBySubject } = require("../public/new-syllabus.js");
const subjectWeightage = getSubjectWeightage()
const unitsBySubject = getUnitsBySubject()
const unitWeightage = getUnitsWeightage()


const createTodayDateId = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Month is zero-based
  const day = String(currentDate.getDate()).padStart(2, "0");
  const dateid = `${year}-${month}-${day}`;
  return dateid;
};


router.get(
  "/testquestions/:typeoftest",
  limitermiddleware,
  async (req, res) => {
    try {
      const { model, num, sub, chap, unit, userid } = req.query;
      const { typeoftest } = req.params;
      const numberofquestions = parseInt(num);


      let testid = req.query.testid !== 'undefined' ? req.query.testid : null;

      if (['dailytest', 'weeklytest'].includes(typeoftest)) {
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

        if (!sub || !(sub in subjectWeightage)) {
          return res.status(400).json({
            message: "Invalid or missing subject",
          });
        }

        if (typeoftest === "unitwise") {
          if (!unit || !(unitsBySubject[sub].includes(unit))) {
            return res.status(400).json({
              message: "Invalid or missing unit",
            });
          }
        }

        if (typeoftest === "chapterwise") {
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
        const subjectKeys = Object.keys(subjectWeightage);
        const questions = [];
        for (const subject of subjectKeys) {
          const selectedquestions = await Question.aggregate([
            {
              $match: {
                subject: subject,
              },
            },
            { $sample: { size: subjectWeightage[subject] * fraction } },
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
        return res.status(200).json({ questions });
      }

      // fetch tests by their ids -- incase the above did not work
      // for custom tests especially
      else {

        // checking for testid -- incase
        if (!testid) {
          return res.status(400).json({
            message: "Can't find testid",
          });
        }

        // checking for authorization in the user request fo ruserid
        // i guess this will prevent spamming as id can be created only in the frontend
        const bearer = req.headers.authorization;
        const token = bearer ? bearer.split(" ")[1] : null;
        if (!token) return res.status(401).json({ message: "Invalid Authentication" });

        const secretkey = process.env.JWT_SECRET_KEY;
        const userFromAuth = jwt.verify(token, secretkey);
        const userid = userFromAuth.id
        if (!userid) return res.status(401).json({ message: "Invalid Authentication" });


        // for daily tests only -- to get current date from server not from client -- timezones may vary
        const test = await CustomTest.findOne({ testid: testid, type: typeoftest });
        if (!test) {
          return res.status(404).json({ message: "Test not foundd" });
        }

        // checking cross-authorization for userid in usersconnected
        if (!test.usersconnected.includes(userid)) {
          return res.status(400).json({
            message: "Broken url found. Please follow the original test link for attempting tests!",
          });
        }

        // checking if user has already attended the test
        const userExists = test.usersattended.some((user) => user.userid === userid);
        if (userExists) {
          return res.status(400).json({
            message: "You Have Already Attended This Test",
          });
        }

        const questionmodel = test.questionmodel;

        const test2 = await CustomTest.findOne({ testid: testid, type: typeoftest })
          .populate({
            path: 'questionsIds',
            model: questionmodel,
            select: '_id question options images answer explanation subject chapter mergedunit',
          })
          .exec();
        const questions = test2.questionsIds
        // questions = await groupQuestionsBySubject(ungroupedQuestions);
        return res.status(200).json({ userid, questions });
      }
    } catch (error) {
      return res.status(400).json({ message: 'Internal Server Error' });
    }
  }
);

// get questions for re-attempt --- only for custom tests
router.get('/re-attempt-questions/:testhexid', VerifyUser, async (req, res) => {
  try {
    const { testhexid } = req.params;

    // checking for testid -- incase
    if (!testhexid) {
      return res.status(400).json({
        message: "Can't find testid",
      });
    }

    const test = await CustomTest.findById(testhexid);
    if (!test) {
      return res.status(404).json({ message: "Test not foundd" });
    }

    const questionmodel = test.questionmodel;
    const test2 = await CustomTest.findById(testhexid)
      .populate({
        path: 'questionsIds',
        model: questionmodel,
        select: '_id question options answer explanation subject chapter mergedunit',
      })
      .exec();
    const questions = test2.questionsIds
    return res.status(200).json({ questions });

  } catch (error) {
    return res.status(400).json({ message: 'Internal Server Error' });
  }
})

// create daily and weekly tests -- for cron jobs
router.get("/createdailytest", async (req, res) => {
  try {
    let questionsArray = [];
    const testid = createTodayDateId();

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const type = (dayOfWeek === 0) ? 'weeklytest' : 'dailytest';

    const existingCustomTest = await CustomTest.findOne({ testid, type });
    if (existingCustomTest) {
      return res.status(400).json({ message: "Test with the same name already exists." });
    }

    // to fetch 10 questions from eaxh subject, as units failed 
    if (type === 'dailytest') {
      for (subject in subjectWeightage) {
        const questions = await Question.aggregate([
          {
            $match: {
              subject: subject,
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
      }
    } else {
      // to get from each unit for 200 questions
      for (const unit in unitWeightage) {
        const weightage = unitWeightage[unit]
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
      type: type,
      name: type === 'dailytest' ? 'Daily Test' : 'Weekly Test',
      testid: testid,
      createdBy: '65a52a7308739d0aa044b295',
      questionsIds: idArray,
      questionmodel: 'Question',
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

// invalidate daily test
router.get("/invalidatedailytest", async (req, res) => {
  try {

    const dateid = createTodayDateId();
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const type = (dayOfWeek === 0) ? 'weeklytest' : 'dailytest';

    await CustomTest.deleteMany({ type, archive: true });

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

// fetch questions for custom model tests 
router.get("/get-questions-for-modeltest", VerifyUser, async (req, res) => {
  try {
    const { num } = req.query;

    let questionsArray = [];
    const userid = req.userId

    if (!num || !['50', '75', '100', '125', '150', '175', '200'].includes(num)) {
      return res.status(404).send({ message: 'number can be either 100 or 200' });
    }

    const number = parseInt(num)
    const fraction = number / 200
    if ([50, 75, 100, 125, 150, 175].includes(number)) {
      // to fetch 10 questions from eaxh subject, as units failed 
      for (const category in subjectWeightage) {
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
          { $sample: { size: subjectWeightage[category] * fraction } },
          {
            $project: {
              _id: 1,
              question: 1,
              options: 1,
              answer: 1,
              explanation: 1,
              images: 1,
              subject: 1,
            },
          },
        ]).exec();
        questionsArray.push(...questions)
      }
    } else {
      // to get from each unit for 200 questions
      for (const unit in unitWeightage) {
        const weightage = unitWeightage[unit]
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
              question: 1,
              options: 1,
              answer: 1,
              explanation: 1,
              images: 1,
              subject: 1,
            },
          },
        ]).exec();
        questionsArray.push(...questions);
        questions.length === 0 && console.log(unit, questions.length); //console the unit with zero questions fetched
      }
    }

    const groupedQuestions = await groupQuestionsBySubject(questionsArray)
    return res.status(200).json(groupedQuestions);

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});


// create custom model tests tests -- not  used naywhere ---
router.post("/create-custom-modeltest", VerifyUser, async (req, res) => {
  try {
    const { name, type, num, username, isOrg } = req.body;

    let questionsArray = [];
    const formattedName = name.replace(/\s+/g, '-');
    const testid = formattedName
    const userid = req.userId

    if (!num || !['50', '75', '100', '125', '150', '175', '200'].includes(num)) {
      return res.status(404).send({ message: 'number can be either 100 or 200' });
    }

    const number = parseInt(num)
    const existingCustomTest = await CustomTest.findOne({ testid, type });
    if (existingCustomTest) {
      return res.status(400).json({ message: "Test Series with the same name already exists." });
    }

    const fraction = number / 200
    if ([50, 75, 100, 125, 150, 175].includes(number)) {
      // to fetch 10 questions from eaxh subject, as units failed 
      for (const category in subjectWeightage) {
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
          { $sample: { size: subjectWeightage[category] * fraction } },
          {
            $project: {
              _id: 1,
            },
          },
        ]).exec();
        questionsArray.push(...questions)
      }
    } else {
      // to get from each unit for 200 questions
      for (const unit in unitWeightage) {
        const weightage = unitWeightage[unit]
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
      type: type,
      name: name,
      createdBy: userid,
      isOrg: isOrg | { state: false },
      questionmodel: 'Question',
      questionsIds: idArray,
      testid: testid,
    });

    await customTest.save();

    if (isOrg && isOrg.state === true) {
      const organization = await Organization.findById(isOrg.by)
      organization.tests.push(customTest._id);
      await organization.save();
    }

    return res.status(200).json({
      message: type + " created successfully",
      url: `${process.env.FRONTEND}/tests/${type}?by=${username.replace(/\s+/g, '-')}&testid=${testid}`,
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

// for creating all types of test from the backend
router.post('/create-test', VerifyUser, async (req, res) => {
  try {
    const { name, type, questiontype, isOrg, questions, isLocked } = req.body;
    const formattedName = name.replace(/\s+/g, '-');
    const testid = formattedName
    const userid = req.userId
    const username = req.user.name

    let organization;
    let image = ''
    if (isOrg && isOrg.state === true) {
      organization = await Organization.findById(isOrg.by)
      image = organization.image
      if (!organization) return res.status(400).json({ message: "Oops organization does not exist." });
    }

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
            subject: subject.toLowerCase(), // Assuming subject is the name in lowercase
            isadded: {
              by: userid,
            }
          }))
        );
      }

      const questionIds = await Promise.all(
        flattenedQuestions.map(async (question) => {
          const newQuestion = new Question(question);
          await newQuestion.save();
          return newQuestion._id;
        })
      );
      question_ids = questionIds

    }

    const customTest = new CustomTest({
      type: type,
      name: name,
      testid: testid,
      image: image || '',
      createdBy: userid,
      questionsIds: question_ids,
      questionmodel: 'Question',
      isOrg: isOrg ? isOrg : { state: false },
    });

    let lockedTestCode
    if (isLocked.state) {
      lockedTestCode = generateVerificationKey(6)
      let lockedObject = {
        ...isLocked,
        code: lockedTestCode
      }
      customTest.isLocked = lockedObject
    }

    await customTest.save();
    if (isOrg && isOrg.state === true) {
      organization.tests.push(customTest._id);
      await organization.save();
    }

    return res.status(200).json({
      message: type + " created successfully",
      url: `${process.env.FRONTEND}/tests/${type}/${testid}?by=${username.toLowerCase().replace(/\s+/g, '-')}`,
      code: lockedTestCode
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal Server Error',
    });
  }
})

// for result page --- 
router.get("/get-custom-tests", async (req, res) => {
  try {
    const tests = await CustomTest.find({
      usersattended: { $exists: true, $not: { $size: 0 } },
    }).select("_id testid date type").lean()

    if (!tests || tests.length === 0) {
      return res.status(200).json({
        message: "No tests found with attendees",
      });
    }
    const groupedData = tests.reduce((acc, obj) => {
      const { type, ...rest } = obj;
      acc[type] = acc[type] || [];
      acc[type].push(rest);
      return acc;
    }, {});

    const filteredData = Object.entries(groupedData).reduce((acc, [type, tests]) => {
      const latestThree = tests.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
      acc[type] = latestThree;
      return acc;
    }, {});

    return res.status(200).json(filteredData)

  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
});

router.get("/get-custom-tests/:type", async (req, res) => {
  try {
    const { type } = req.params;
    if (!type) {
      return res.status(400).json({
        message: "Undefined type",
      });
    }

    // Retrieve the test
    let tests = await CustomTest.find({ type: type })
      .populate({
        path: "createdBy",
        select: "name email"
      })
      .select('image name createdBy usersattended date testid')
      .exec()
    if (!tests || tests.length == 0) {
      return res.status(404).json({ message: "tests not found" });
    }

    return res.status(200).json(tests);

  } catch (error) {
    console.error("Error in getdailytests route:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// fetch custom tests -- based on type and test id---
// to retrive tests for tests as well as preview before test
router.get('/get-custom-tests/:type/:testid', async (req, res) => {
  try {
    const { type, testid } = req.params

    // checking for authorization in the user request fo ruserid
    // i guess this will prevent spamming as id can be created only in the frontend
    const bearer = req.headers.authorization;
    const token = bearer ? bearer.split(" ")[1] : null;
    if (!token) return res.status(401).json({ message: "Invalid Authentication" });

    const secretkey = process.env.JWT_SECRET_KEY;
    const userFromAuth = jwt.verify(token, secretkey);
    const userid = userFromAuth.id
    if (!userid) return res.status(401).json({ message: "Invalid Authentication" });

    const customTest = await CustomTest.findOne({ type, testid })
      .populate({
        path: "createdBy",
        select: "_id name email image",
        options: { lean: true },
      })
      .populate({
        path: "isOrg.by",
        select: "name"
      })
      .select('image name type createdBy testid questionsIds isLocked archive usersconnected')
      .exec() //.lean() will return a plain object so can't save or modify the data in db

    if (!customTest) {
      return res.status(300).json({ message: 'No test available' })
    }
    // CHECKING FOR ACCESS TO TESTS FOR USERS
    let isAllowed = true
    const isLocked = customTest.isLocked
    if (isLocked.state) {
      const { type } = isLocked
      if (type === 'private' && customTest.createdBy._id.toString() !== userid) {
        isAllowed = false
      } else if (type === 'org') { //checking if the user is in the org before accessing the test
        const organization = await Organization.findById(customTest.isOrg.by)
        const users = organization.users
        const moderators = organization.moderators
        const creator = organization.createdBy
        if (!users.includes(userid) && !moderators.includes(userid) && userid !== creator) isAllowed = false
      }
    }

    // adding user to usersconnected for cross-authentication --- only if the user is allowed
    if (isAllowed) {
      customTest.usersconnected.push(userid)
      const saved = await customTest.save()
    }

    const modifiedCustomTests = {
      name: customTest.name,
      testid: customTest.testid,
      image: customTest.image,
      createdBy: {
        email: customTest.createdBy ? customTest.createdBy.email : '',
        name: customTest.createdBy ? customTest.createdBy.name : '',
      },
      numberOfQuestions: customTest.questionsIds.length,
      type: customTest.type,
      isLocked: customTest.isLocked,
      isAllowed,
      testToken: token
    }
    return res.status(200).json(modifiedCustomTests)

  } catch (error) {
    console.error('Error :', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// meta data api fetching for custom tests
router.get('/get-custom-tests-metadata/:type/:testid', async (req, res) => {
  try {
    const { type, testid } = req.params

    const customTest = await CustomTest.findOne({ type, testid })
      .populate({
        path: "createdBy",
        select: "name image",
        options: { lean: true },
      })
      .select('image name createdBy')
      .exec() //.lean() will return a plain object so can't save or modify the data in db

    if (!customTest) {
      return res.status(300).json({ message: 'No test available' })
    }

    const test = {
      name: customTest.name,
      testid: customTest.testid,
      image: customTest.image,
      creatorImage: customTest.createdBy ? customTest.createdBy.image : '',
      creatorName: customTest.createdBy ? customTest.createdBy.name : '',
    }
    return res.status(200).json(test)

  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// for results
router.get('/get-customtest/:id', async (req, res) => {
  try {
    const { id } = req.params
    const test = await CustomTest.findById(id)
    if (!test) {
      return res.status(300).json({ message: 'No test available' })
    }

    const customTest = await CustomTest.findById(id)
      .populate({
        path: "questionsIds",
        model: test.questionmodel,
        select: "question options answer explanation images"
      })
      .select('usersattended questionsIds')
      .exec();

    customTest.usersattended.sort((a, b) => b.totalscore - a.totalscore);
    let users = []

    let rank = 1;
    for (const user of customTest.usersattended) {
      users.push({
        userid: user.userid,
        totalscore: user.totalscore,
        name: user.name,
        rank: rank,
      })
      rank++;
    }

    return res.status(200).json({ questions: customTest.questionsIds, users })

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
    const chapterCounts = await Question.aggregate([
      { $match: { subject: sub } },
      { $group: { _id: '$chapter', count: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', count: 1 } }
    ]);
    return res.json(chapterCounts);
  } catch (error) {
    console.error('Error retrieving chapters:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


// get subjects and it number of questions
router.get('/get-subjects', async (req, res) => {
  try {
    const subjectsWithCount = await Question.aggregate([
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', count: 1 } }
    ]);
    return res.json(subjectsWithCount);
  } catch (error) {
    console.error('Error retrieving subjects with count:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Fetch merged units for merged unitwise tests using aggregation pipeline
router.get('/get-mergedunits', async (req, res) => {
  try {
    const { sub } = req.query;
    if (!sub) {
      return res.status(400).json({ error: 'Subject not provided' });
    }
    const mergedUnitCounts = await Question.aggregate([
      { $match: { subject: sub } },
      { $group: { _id: '$mergedunit', count: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', count: 1 } }
    ]);
    return res.json(mergedUnitCounts);
  } catch (error) {
    console.error('Error retrieving merged units:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});



// fetch sets for pastpapers
router.get('/get-pastpapers/:affiliation', async (req, res) => {
  try {
    const affiliation = req.params.affiliation
    if (!affiliation) return res.status(400).json({ message: 'Missing affiliation' });
    const pastYearSets = await CustomTest.find({ type: "pastpapers" })
      .select('name testid type')
      .exec();

    const filteredSets = pastYearSets.filter(set => {
      const [setAffiliation] = set.testid.split('-');
      return setAffiliation === affiliation;
    });


    // const categorizedSets = pastYearSets.reduce((acc, set) => {
    //   const [affiliation, year] = set.testid.split('-');
    //   if (!acc[affiliation]) {
    //     acc[affiliation] = [];
    //   }
    //   acc[affiliation].push({ ...set.toObject(), year });
    //   return acc;
    // }, {});

    return res.status(200).json(filteredSets);


  } catch (error) {
    console.error('Error retrieving chapters:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/get-pastpapers-count', async (req, res) => {
  try {
    const pastYearSets = await CustomTest.find({ type: "pastpapers" })
      .select('testid')
      .exec();

    // Count occurrences of unique testid[0]
    const countMap = pastYearSets.reduce((acc, set) => {
      const firstChar = set.testid.split('-')[0];
      acc[firstChar] = (acc[firstChar] || 0) + 1;
      return acc;
    }, {});

    return res.status(200).json(countMap);
  } catch (error) {
    console.error('Error retrieving pastpapers count:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


/* EXPERIMENTAL STUFFS */
router.post('/create-test/:organizationid', async (req, res) => {
  try {
    const { name, questiontype, questions } = req.body;
    const { createdby, organizationid } = req.params;

    const organization = await Organization.findById(organizationid);
    if (!organization) return res.status(404).json({ message: 'Organization not found.' });
    const organizationsParams = {
      type: organization.uniqueId,
      isSponsored: {
        state: true,
        by: organization.name,
        image: organization.image
      },
    }
    const formattedName = name.replace(/\s+/g, '-');
    const testid = formattedName + '-' + createTodayDateId();

    const existingCustomTest = await CustomTest.findOne({
      testid,
      type: organization.uniqueId
    })
    if (existingCustomTest) {
      return res.status(400).json({ message: "Test Series with the same name already exists." });
    }

    let test_id
    if (questiontype === 'withoutid') {
      const customTest = new CustomTest({
        testid: testid,
        questions: questions,
        questiontype: questiontype,
        ...organizationsParams
      });
      await customTest.save();
      test_id = customTest._id
    }

    if (questiontype === 'withid') {
      const customTest = new CustomTest({
        testid: testid,
        questionsIds: questions,
        questiontype: questiontype,
        ...organizationsParams
      });
      await customTest.save();
      test_id = customTest._id
    }

    organization.tests.push(test_id)
    organization.save()

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

router.post('/add-anal', async (req, res) => {
  try {
    const { test_id, userid, score, timetaken } = req.body
    let anal = await Analytic.findOne({ userid })
    if (!anal) {
      anal = new Analytic({
        userid,
        tests: [
          {
            test: test_id,
            score,
            timetaken,
          }]
      })
      await anal.save()
      return res.status(200).json({ anal })
    }

    anal.tests.push({
      test: test_id,
      score,
      timetaken,
    })
    await anal.save()
    return res.status(200).json({ anal })

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal Server Error',
    });
  }
})

router.post('/add-nonanal', async (req, res) => {
  try {
    const { userid, score, type, name } = req.body
    if (!['subjectwise', 'chapterwise', 'unitwise'].includes(type)) {
      return res.status(300).json({ message: 'invalid request' })
    }

    let anal = await Analytic.findOne({ userid })
    if (!anal) {
      anal = new Analytic({ userid })
      await anal.save()
    }

    // save by checking the type in their respective array
    anal.nontests.push({ n: name, s: score, t: type })

    await anal.save()
    return res.status(200).json({ anal })

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal Server Error',
    });
  }
})

// DEPRECATED
// 
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

