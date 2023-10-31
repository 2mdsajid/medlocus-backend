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
    return res.status(500).json({
      message: "Failed to add email",
      error: error.message,
    });
  }
});

module.exports = router;
