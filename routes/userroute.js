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

// add feedback and mail it to the owner
router.post("/sendconfirmationemail", async (req, res) => {
  try {
    const { name, id, email,verificationid, verificationkey } = req.body;
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

module.exports = router;
