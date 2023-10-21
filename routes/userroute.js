const express = require("express");
const router = express.Router();

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

const createTodayDateId = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Month is zero-based
  const day = String(currentDate.getDate()).padStart(2, "0");
  const dateid = `${year}-${month}-${day}`;
  return dateid;
};

router.get("/addusertotest", async (req, res) => {
  const userid = req.query.userid;
  console.log("🚀 ~ file: userroute.js:90 ~ router.get ~ userid:", userid);
  const dateid = createTodayDateId();
  const test = await DailyTest.findOne({
    dateid: dateid,
  });
  if (!test) {
    return res.status(400).json({
      message: "cant fin test",
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
  const { userid, name, score, email } = req.body;
  if (!userid) {
    return res.status(400).json({
      message: "no userid or name provided",
    });
  }
  const test = await DailyTest.findOne({
    dateid: dateid,
  });
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
  const html =`<div style="background-color: #F8FAFC; padding: 32px;max-width:40rem;margin"0 auto;">
  <div style="background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); padding: 32px; text-align: center;">
    <img src="${LOGO_URL}" alt="Your Logo" style="max-width: 150px; margin-bottom: 16px;">
    <h2 style="font-size: 28px; font-weight: bold; margin: 0 0 16px;">User Details</h2>
    <p style="font-size: 18px; margin-bottom: 16px;">Hello ${name},</p>
    <p style="font-size: 18px; margin-bottom: 16px;">Here are the user details:</p>
    <div style="background-color: #E0E0E0; padding: 12px; border-radius: 8px; margin: 16px 0;">
      <p style="font-size: 16px; margin: 0;"><strong>User ID:</strong> ${userid}</p>
    </div>
    <div style="background-color: #E0E0E0; padding: 12px; border-radius: 8px; margin: 16px 0;">
      <p style="font-size: 16px; margin: 0;"><strong>Name:</strong> ${decodeURI(name)}</p>
    </div>
    <div style="background-color: #E0E0E0; padding: 12px; border-radius: 8px; margin: 16px 0;">
      <p style="font-size: 16px; margin: 0;"><strong>Score:</strong> ${score}</p>
    </div>
    <div style="background-color: #3498db; color: #fff; padding: 10px; border-radius: 8px; margin: 16px 0;">
      <p style="font-size: 16px; margin: 0;">Test ID: ${dateid}</p>
    </div>
    <div style="background-color: #2ecc71; color: #fff; padding: 10px; border-radius: 8px; margin: 16px 0;">
      <p style="font-size: 16px; margin: 0;">Take tomorrow's test at 4 PM.</p>
    </div>
    <a href="${process.env.FRONTEND}/result" style="color: #3498db; text-decoration: none; font-size: 16px; margin: 16px 0; display: block;">View Leaderboard and Answers</a>
    <p style="font-size: 18px; margin: 16px 0;">Thanks for attending the test. We encourage you to participate in other tests available in the Test section.</p>
    <p style="font-size: 18px; margin: 16px 0;">If you encounter any problems, feel free to discuss them in the Discussion section. You can also seek help and guidance from the toppers of previous tests.</p>
  </div>
</div>

`
;
  const send_email = await sendEmail(subject, email, html);
  console.log("🚀 ~ file: userroute.js:117 ~ router.post ~ send_email:", send_email)

  return res.status(200).json({
    message: "saved user score",
    savedest,
  });
});
module.exports = router;
