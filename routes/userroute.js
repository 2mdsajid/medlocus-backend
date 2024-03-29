const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// nodemailer cofnigurration
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "livingasrb007@gmail.com",
    pass: process.env.GMAIL_PASSWORD,
  },
});

const DailyTest = require("../schema/dailytest");
const Admin = require("../schema/admin");
const User = require("../schema/user");
const NonUser = require("../schema/nonuser");
const Organization = require("../schema/organization");
const Unsubscribed = require("../schema/unsubscribed");
const Feedback = require("../schema/feedback");
const Request = require("../schema/request");
const Analytic = require("../schema/analytic");


const { VerifyUser, VerifyAdmin, VerifyModerator } = require("../middlewares/middlewares");

const { sendEmail, LOGO_URL } = require("./gmailroute");
const CustomTest = require("../schema/customtests");
const createAdmin = async () => {
  const createdadmin = new Admin({
    _id: '65929d68e64ad4813aa6b911',
    uuid: "5b2afb0b-2686-4691-8f3b-a72d294c4853",
    username: "sajid",
    name: "sajid",
    email: "2mdsajid@gmail.com",
    key: "key",
    password: "key",
  });

  const admincreated = await createdadmin.save();
};

// createAdmin()

router.get("/unsubscribe", VerifyUser, async (req, res) => {
  try {
    const email = req.user.email;
    if (!email) {
      return res.status(400).json({
        message: "Couldn't process the request",
      });
    }

    // const unsubs = await new Unsubscribed({
    //   emails: ['2alamsajid@gmail.com'],
    // });

    // await unsubs.save()
    // return

    const unsubscribed = await Unsubscribed.findOne({
      _id: "65406c3d29258e406528c0d8",
    });
    if (!unsubscribed.emails.includes(email)) {
      unsubscribed.emails.push(email);
      await unsubscribed.save();
      return res.status(201).json({
        message: "Email unsubscribed successfully",
      });
    }
    return res.status(300).json({ message: "Email already unsubscribed" });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to add email",
      error: error.message,
    });
  }
});

// get single user data
router.get("/user", VerifyUser, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select('_id name email image role key questions discussions')
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user })
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// get user analytics
router.get("/calculate-total-score", VerifyUser, async (req, res) => {
  try {
    const userId = req.userId;
    const userAnalytic = await Analytic.findOne({ userid: userId });
    if (!userAnalytic) return res.status(404).json({ message: "User not found" });

    const chapterscores = userAnalytic.chapterscores[0];
    const chapterNames = Object.keys(chapterscores);

    const totalScores = chapterNames.reduce((acc, chapter) => {
      const chapterData = chapterscores[chapter];
      const totalScore = chapterData.reduce((sum, entry) => sum + entry.c, 0) / chapterData.reduce((sum, entry) => sum + entry.t, 0) * 100;
      acc[chapter] = totalScore;
      return acc;
    }, {});

    return res.status(200).json(totalScores);
  } catch (error) {
    console.error("Error calculating total score:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// get anal of a user by themselves
router.get("/get-anal", VerifyUser, async (req, res) => {
  try {
    const userId = req.userId;
    const userAnalytic = await Analytic.findOne({ userid: userId })
      .populate({
        path: 'tests.test',
        select: '_id name type'
      })
      .populate({
        path: 'incorrect',
        select: 'question chapter subject'
      })
      .exec()

    if (!userAnalytic) return res.status(404).json({ message: "User not found" });

    // calculating chapters score
    const chapterscores = userAnalytic.chapterscores[0];
    const chapterNames = Object.keys(chapterscores);

    const totalChapterScores = chapterNames.map((chapter) => {
      const chapterData = chapterscores[chapter];
      const totalCorrect = chapterData.reduce((sum, entry) => sum + entry.c, 0);
      const totalTotal = chapterData.reduce((sum, entry) => sum + entry.t, 0);

      const score = ((totalCorrect / totalTotal) * 100).toFixed(2);
      return {
        chapter,
        correct: totalCorrect,
        total: totalTotal,
        score: isNaN(score) ? 0 : score, // To handle division by zero scenarios
      };
    });

    // trimming the tests data for final shape
    let attendedTests = []
    if (userAnalytic.tests.length > 0) {
      attendedTests = userAnalytic.tests.map(test => ({
        score: `${test.score.c}/${test.score.t}`,
        name: test.test.name,
        type: test.test.type,
        _id: test.test._id,
        timetaken: `${test.timetaken.t} (${test.timetaken.a} av)`
      }));
    }

    // incorrect questions
    const incorrectQuestions = userAnalytic.incorrect || []

    // past 7 days tests
    const pastSevenDaysTests = []
    for (const test of userAnalytic.weektests) {
      pastSevenDaysTests.push({
        _id: test._id,
        name: test.name,
        date: test.createdAt,
        questionsLength: test.questions.length
      })
    }


    // const user = await User.findOne({ _id: userId })
    //   .populate({
    //     path: 'questions',
    //     select: 'question isverified.state isverified.message'
    //   })
    //   .select('question')
    //   .exec()
    // const questionsReported = user.questions


    let testsCreated = await CustomTest.find({
      createdBy: userId
    }).select('_id name testid type date') || []

    return res.status(200).json({
      chapterScores: totalChapterScores,
      testsCreated,
      attendedTests,
      incorrectQuestions,
      pastSevenDaysTests
    });

  } catch (error) {
    console.error("Error :", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// get single test quesitons and details from past seven days
// user to fetch in query param
// for admin, non admin, moderators all
router.get("/get-past-anal/:analId", VerifyUser, async (req, res) => {
  try {
    const userId = req.query.userId;
    const analId = req.params.analId;
    if (!analId) return res.status(404).json({ message: "Not FOund" });

    const userAnalytic = await Analytic.findOne({ userid: userId })
      .populate({
        path: 'weektests.questions.qn',
        select: 'question chapter subject options answer explanation'
      })
      .exec()
    if (!userAnalytic) return res.status(404).json({ message: "User not found" });

    const currentAnal = userAnalytic.weektests.find(test => String(test._id) === analId);
    // past 7 days tests
    let modifiedQuestions = []
    for (const questionData of currentAnal.questions) {
      const extractedQuestion = {
        question: questionData.qn.question,
        answer: questionData.qn.answer,
        options: questionData.qn.options,
        explanation: questionData.qn.explanation,
        subject: questionData.qn.subject,
        chapter: questionData.qn.chapter,
        mergedunit: questionData.qn.mergedunit || null,
        uans: questionData.uans,
        timetaken: questionData.t
      };
      modifiedQuestions.push(extractedQuestion);
    }

    currentAnal.questions = modifiedQuestions;
    modifiedWeekAnal = {
      name: currentAnal.name,
      questions: modifiedQuestions,
      date: currentAnal.createdAt
    }
    return res.status(200).json({
      ...modifiedWeekAnal
    });

  } catch (error) {
    console.error("Error calculating total score:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// get analytics for organizaiton users by mooderators
router.get("/get-anal/:userid", VerifyUser, async (req, res) => {
  try {

    if (!['moderator', 'admin', 'sajid'].includes(req.role)) {
      return res.status(301).json({ message: "Oopps forbidden" });
    }
    const userId = req.params.userid;
    const userAnalytic = await Analytic.findOne({ userid: userId })
      .populate({
        path: 'tests.test',
        select: '_id name type'
      })
      .populate({
        path: 'incorrect',
        select: 'question chapter subject'
      })
      .populate({
        path: 'userid',
        select: 'name email image payment'
      })
      .exec()

    // getting the user data only --- in case no userAnalytic present -- user has not given any test
    if (!userAnalytic) {
      const userProfile = await User.findById(userId)
        .select('name image email payment')
        .exec()
      return res.status(200).json({ userProfile })
    }

    // calculating chapters score
    const chapterscores = userAnalytic.chapterscores[0];
    const chapterNames = Object.keys(chapterscores);

    const totalChapterScores = chapterNames.map((chapter) => {
      const chapterData = chapterscores[chapter];
      const totalCorrect = chapterData.reduce((sum, entry) => sum + entry.c, 0);
      const totalTotal = chapterData.reduce((sum, entry) => sum + entry.t, 0);

      const score = ((totalCorrect / totalTotal) * 100).toFixed(2);
      return {
        chapter,
        correct: totalCorrect,
        total: totalTotal,
        score: isNaN(score) ? 0 : score, // To handle division by zero scenarios
      };
    });

    // trimming the tests data for final shape
    const attendedTests = userAnalytic.tests.map(test => ({
      score: `${test.score.c}/${test.score.t}`,
      name: test.test.name,
      type: test.test.type,
      _id: test.test._id,
      timetaken: `${test.timetaken.t} (${test.timetaken.a} av)`
    })) || []

    // incorrect questions
    const incorrectQuestions = userAnalytic.incorrect || []

    // getting basic user info
    const user = userAnalytic.userid
    const userProfile = {
      name: user.name,
      email: user.email,
      image: user.image,
      payment: user.payment
    }

    // past 7 days tests
    const pastSevenDaysTests = []
    for (const test of userAnalytic.weektests) {
      pastSevenDaysTests.push({
        _id: test._id,
        name: test.name,
        date: test.createdAt,
        questionsLength: test.questions.length
      })
    }

    return res.status(200).json({
      chapterScores: totalChapterScores,
      attendedTests,
      incorrectQuestions,
      userProfile,
      pastSevenDaysTests
    });

  } catch (error) {
    console.error("Error calculating total score:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// get users for editing --- admin only
router.get('/get-user-data/:userid', VerifyAdmin, async (req, res) => {
  try {
    const userId = req.params.userid;
    if (!userId) {
      return res.status(500).json({ message: "Not Found" });
    }
    const user = await User.findById(userId)
      .select('_id name image email payment')
      .exec()
    res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
})

// update user role
router.post("/update-user", VerifyAdmin, async (req, res) => {
  try {
    const { id, role } = req.body;
    if (!id || !role) return res.status(400).json({ message: 'Fuck bro you missing something fields.' });

    const user = await User.findById(id)
    if (!user) return res.status(404).json({ message: 'oopss missing' })

    user.role = role
    await user.save();

    return res.status(201).json({ message: 'updated role successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// for non logged users
router.post("/add-nonuser", async (req, res) => {
  try {
    const { value } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;

    if (!value) return res.status(400).json({ message: 'Fuck bro you missing something fields.' });

    const existingNonUser = await NonUser.findOne({ uuid: value });
    if (existingNonUser) return res.status(400).json({ message: 'Non-user with the provided key already exists.' });

    const newNonUser = new NonUser({
      uuid: value,
      ip
    });
    await newNonUser.save();
    return res.status(201).json({ message: 'Non-user added successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});


// create an organization
router.post('/create-organization', VerifyUser, async (req, res) => {
  try {
    const { name, uniqueId, image } = req.body;
    const createdBy = req.userId
    if (!name || !uniqueId) {
      return res.status(400).json({ message: 'Missing parameters' });
    }

    const existingOrganization = await Organization.findOne({ uniqueId });
    if (existingOrganization) {
      return res.status(400).json({ message: 'Organization with this uniqueId already exists' });
    }

    // make sure to migrate old data for this
    const newOrganization = new Organization({
      createdBy,
      name,
      uniqueId,
      image: image || '',
      moderators: [createdBy],
      users: [createdBy],
    });


    const user = await User.findById(createdBy)
    user.organizations.push(newOrganization._id);
    await user.save()
    await newOrganization.save();

    return res.status(201).json({ organizationId: newOrganization._id });

  } catch (error) {
    console.error('Error creating organization:', error.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// join an org
router.get('/join-org/:orgid', VerifyUser, async (req, res) => {
  try {
    const accessToken = req.params.orgid;
    const userid = req.userId
    if (!accessToken) {
      return res.status(400).json({ message: 'Invalid ref token' })
    }

    const [orgId, userKey] = accessToken.split('-');
    const organization = await Organization.findById(orgId);
    if (!organization) return res.status(404).json({ message: 'Organization not found.' });

    const keyType = organization.keys.moderator === userKey ? 'moderators' : organization.keys.user === userKey ? 'users' : null;
    if (!keyType) return res.status(400).json({ message: 'Invalid key.' });
    if (organization[keyType].includes(userid)) return res.status(400).json({ message: `User already exists in the organization as ${keyType}.` });

    organization[keyType].push(userid);
    await organization.save();

    const user = await User.findById(userid)
    user.organizations.push(orgId);

    const currentDateTime = new Date();
    const paymentExpireDateTime = new Date(organization.payment.expireAt);
    if (organization.state === 'premium' && (currentDateTime < paymentExpireDateTime)) {
      user.payment = organization.payment
    }
    await user.save();

    return res.status(200).json({
      message: `successfully joined ${organization.name} as ${keyType}.`
    })

  } catch (error) {
    console.error('Error adding user to organization:', error.message);
    return res.status(500).json({ message: error.message });
  }
});

// get all organization associated - created by a user
router.get('/get-organizations/', VerifyUser, async (req, res) => {
  try {
    const userid = req.userId;
    const organizations = await Organization.find({
      $or: [
        { moderators: userid },
        { users: userid },
      ],
    }).populate({
      path: 'createdBy',
      select: '_id name',
    })

    if (!organizations || organizations.length === 0) {
      const organizationsFiltered = []
      return res.status(404).json(organizationsFiltered);
    }

    const organizationsFiltered = organizations.map(org => ({
      name: org.name,
      uniqueId: org.uniqueId,
      createdBy: org.createdBy,
      usersCount: org.users.length,
      testsCount: org.tests.length,
      moderatorsCount: org.moderators.length,
      keys: {
        moderator: org.keys.moderator,
        user: org.keys.user,
      },
      _id: org._id,
      date: org.date
    }));
    res.status(200).json(organizationsFiltered);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// fetch a single organization
// only for moderators -- 
router.get('/get-organization/:organizationid', VerifyUser, async (req, res) => {
  try {
    const { organizationid } = req.params;
    if (!organizationid) return res.status(404).json({ message: 'your organization id is missing' });

    const organization = await Organization
      .findById(organizationid)
      .populate({
        path: 'users',
        select: 'name email image',
        populate: {
          path: 'analytic',
          select: 'chapterscores'
        }
      })
      .populate({
        path: 'moderators createdBy',
        select: 'name email image',
      })
      .populate({
        path: 'tests',
        select: 'testid date usersattended name',
      })
      .exec();
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }


    // organization.users.forEach(user => {
    //   const chapterscores = user.analytic.chapterscores[0]; // Assuming chapterscores is an array
    //   const result = { score: { t: 0, c: 0 } };

    //   // Loop through each key in chapterscores
    //   Object.keys(chapterscores).forEach(key => {
    //     const values = chapterscores[key];

    //     // Calculate the sum of 't' and 'c' for each key
    //     const sumT = values.reduce((acc, curr) => acc + curr.t, 0);
    //     const sumC = values.reduce((acc, curr) => acc + curr.c, 0);

    //     // Add the sum to the overall user score
    //     result.score.t += sumT;
    //     result.score.c += sumC;

    //     // Store the sum for each key in the result object
    //     result[key] = {
    //       sumT,
    //       sumC
    //     };
    //   });

    //   // Calculate the total sum of 't' and 'c' for every key in chapterscores
    //   const totalSumT = Object.values(chapterscores).reduce((acc, values) => acc + values.reduce((innerAcc, curr) => innerAcc + curr.t, 0), 0);
    //   const totalSumC = Object.values(chapterscores).reduce((acc, values) => acc + values.reduce((innerAcc, curr) => innerAcc + curr.c, 0), 0);

    //   // Add the total sum to the overall user score
    //   result.score.t += totalSumT;
    //   result.score.c += totalSumC;

    //   // Update the fetched user object with the calculated result
    //   user.analytic.score = { t: totalSumT, c: totalSumC };
    // });

    res.json(organization);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// for feedback and contsct
router.post('/feedback', async (req, res) => {
  try {
    const { name, email, message, image } = req.body;

    // Create a new feedback instance using the Feedback model
    const feedback = new Feedback({
      name,
      email,
      message,
      image
    });

    // Save the feedback to the MongoDB database
    await feedback.save();

    res.status(201).json({ success: true, message: 'Feedback saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});
// for user requests
router.post('/send-request', VerifyUser, async (req, res) => {
  try {
    const { phone } = req.body;

    const existingRequest = await Request.findOne({ phone, user: req.userId });
    if (existingRequest) {
      return res.status(400).json({ message: 'Request with this phone number already exists.' });
    }

    const request = new Request({
      phone,
      user: req.userId,
    });

    await request.save();

    res.status(201).json({ success: true, message: 'request received! Stay tuned.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});


//EXPERIMENTAL STUFFS
router.post('/complete-registration/:id', async (req, res) => {
  try {
    const { institution, accessToken } = req.body;
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.institution = institution
    user.isCompleted = true;
    await user.save();

    const anal = new Analytic({ userid: userId })
    await anal.save();

    if (accessToken) {
      const [orgId, userKey] = accessToken.split('-');
      const organization = await Organization.findById(orgId);
      if (!organization) return res.status(404).json({ message: 'Organization not found.' });

      const keyType = organization.keys.moderator === userKey ? 'moderators' : organization.keys.user === userKey ? 'users' : null;
      if (!keyType) return res.status(400).json({ message: 'Invalid key.' });
      if (organization[keyType].includes(userId)) return res.status(400).json({ message: 'User already exists in the organization.' });

      organization[keyType].push(userId);
      await organization.save();

      user.tokensUsed.push(accessToken)
      await user.save();
    }

    res.status(200).json({ message: 'Registration completed successfully' });

  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});


module.exports = router;
