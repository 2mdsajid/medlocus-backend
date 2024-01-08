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

const { VerifyUser } = require("../middlewares/middlewares");

const { sendEmail, LOGO_URL } = require("./gmailroute");
const createAdmin = async () => {
  const createdadmin = new Admin({
    uuid: "",
    username: "",
    name: "",
    email: "",
    key: "",
    password: "",
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
    console.log("🚀 ~ file: userroute.js:64 ~ router.get ~ error:", error)
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

// fhgjhk
router.get("/get-anal", VerifyUser, async (req, res) => {
  try {
    const userId = req.userId;
    const userAnalytic = await Analytic.findOne({ userid: userId });

    if (!userAnalytic) return res.status(404).json({ message: "User not found" });

    const chapterscores = userAnalytic.chapterscores[0];
    const chapterNames = Object.keys(chapterscores);

    const totalScores = chapterNames.map((chapter) => {
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

    const user = await User.findOne({ _id: userId })
      .populate({
        path: 'questions',
        select: 'question isverified.state isverified.message'
      })
      .select('question')
      .exec()

    const questionsReported = user.questions
    return res.status(200).json({ chapterScores: totalScores, questionsReported });
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
    const userAnalytic = await Analytic.findOne({ userid: userId });

    if (!userAnalytic) return res.status(404).json({ message: "User not found" });

    const chapterscores = userAnalytic.chapterscores[0];
    const chapterNames = Object.keys(chapterscores);

    const totalScores = chapterNames.map((chapter) => {
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

    const user = await User.findOne({ _id: userId })
      .populate({
        path: 'questions',
        select: 'question isverified.state isverified.message'
      })
      .select('question name email image payment.isPaid')
      .exec()

    const profile = {
      name: user.name,
      email: user.email,
      image: user.image,
      isSubscribed: user.payment.isPaid
    }
    const questionsReported = user.questions
    return res.status(200).json({ chapterScores: totalScores, questionsReported, profile });
  } catch (error) {
    console.error("Error calculating total score:", error);
    return res.status(500).json({ message: "Internal Server Error" });
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
    const { name, uniqueId } = req.body;
    const createdBy = req.userId
    if (!name || !uniqueId) {
      return res.status(400).json({ message: 'Missing parameters' });
    }

    const existingOrganization = await Organization.findOne({ uniqueId });
    if (existingOrganization) {
      return res.status(400).json({ message: 'Organization with this uniqueId already exists' });
    }

    const newOrganization = new Organization({
      createdBy,
      name,
      uniqueId,
      image: '',
      moderators: [createdBy],
    });

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
    user.payment = {
      isPaid: true,
      method: 'organization'
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

    const organizations = await Organization
      .find({ createdBy: userid })
      .populate({
        path: 'createdBy',
        select: 'name',
      });

    if (!organizations || organizations.length === 0) {
      return res.status(404).json({ message: 'Organizations not found' });
    }

    const cleanedOrganizations = organizations.map(org => ({
      name: org.name,
      uniqueId: org.uniqueId,
      createdBy: org.createdBy.name,
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
    res.status(200).json(cleanedOrganizations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


router.get('/get-organization/:organizationid', VerifyUser, async (req, res) => {
  try {
    const { organizationid } = req.params;
    if (!organizationid) return res.status(404).json({ message: 'your organization id is missing' });

    const organization = await Organization
      .findById(organizationid)
      .populate({
        path: 'users',
        select: 'name email image',
      })
      .populate({
        path: 'moderators createdBy',
        select: 'name email image',
      })
      .populate({
        path: 'tests',
        select: 'testid date',
      })
      .exec();
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.json(organization);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
