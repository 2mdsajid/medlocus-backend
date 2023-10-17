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

const createAdmin = async () => {
  const createdadmin = new Admin({
    uuid:'65ddd2e4-742d-4ebd-89f2-6d978f7c5ca3',
    username: "2alamsajid",
    name: "sajid",
    email: "2alamsajid@gmail.com",
    key: "asecretkey",
    password: "boredofmakingthissite",
  });

  await createdadmin.save();
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

// add feedback and mail it to the owner
router.post("/sendconfirmationemail", async (req, res) => {
  try {
    const { name, id, email, verificationid, verificationkey } = req.body;
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Confirm Your Email",
      html: `<div style="background-color:#F8FAFC;padding:32px">
                <div style="background-color:#FFFFFF;border-radius:16px;padding:32px;text-align:center">
                  <h2 style="font-size:28px;font-weight:bold;margin:0 0 16px">Confirmation Email</h2>
                  <p style="font-size:16px;margin-bottom:16px">Hello ${name},</p>
                  <p style="font-size:16px;margin-bottom:16px">Thank you for signing up! Please confirm your email by clicking the link below:</p>
                  <a href="${process.env.BASE_URL}/confirmemail?u=${id}&k=${verificationkey}&v=${verificationid}" style="font-size:16px;color:#007BFF;text-decoration:none">Confirm Email</a>
                </div>
              </div>
              `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Confirmation email sent to ${email}`);
    } catch (error) {
      if (error.message.includes("Invalid recipient")) {
        console.log(`Wrong email address: ${email}`);
      } else {
        return res.status(201).json({
          message: "confirmation email not sent",
          status: 201,
          meaning: "created",
        });
      }
    }

    return res.status(201).json({
      message: "confirmation email sent successfully",
      status: 201,
      meaning: "created",
    });
  } catch (error) {
    return res.status(501).json({
      message: error.message,
      status: 501,
      meaning: "internalerror",
    });
  }
});

router.get("/addusertotest", async (req, res) => {
  const userid = req.query.userid;
  console.log("🚀 ~ file: userroute.js:90 ~ router.get ~ userid:", userid)
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
  const { userid, name, score } = req.body;
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
  return res.status(200).json({
    message: "saved user score",
    savedest,
  });
});
module.exports = router;
