const express = require("express");
const router = express.Router();

// nodemailer cofnigurration
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

const LOGO_URL =
  "https://res.cloudinary.com/dww0rxb4q/image/upload/v1697909046/isdru9pwcz1pixsnsgx9.png";

const sendEmail = (subject, email, html) => {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: subject,
    html: html,
  };

  return transporter.sendMail(mailOptions);
};

// add feedback and mail it to the owner
router.post("/sendwelcomemail", async (req, res) => {
  try {
    const { name, email } = req.body;
    const subject = "Welcome To Medlocus";
    const html = `<div style="background-color:#F8FAFC;padding:32px;max-width:40rem;margin:0 auto;">
    <div style="background-color:#FFFFFF;border-radius:16px;box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);padding:32px;text-align:center">
      <!-- Replace LOGO_URL with your actual logo URL -->
      <img src="${LOGO_URL}" alt="Your Logo" style="max-width: 150px; margin-bottom: 16px">
      <h2 style="font-size:28px;font-weight:bold;margin:0 0 16px">Welcome To Medlocus</h2>
      <p style="font-size:18px;margin-bottom:16px">Hello ${name},</p>
      <p style="font-size:16px;margin-bottom:16px">Thank you for signing up!</p>
      <p style="font-size:16px;margin-bottom:16px">We are looking forward to meeting you at several tests, discussions, and mentorship programs at Medlocus. Your active participation is highly valued. Get started with the following:</p>

      <div style="background-color: #3498db; color: #fff; padding: 10px; border-radius: 8px; margin: 16px 0;">
        <a href="${process.env.FRONTEND}/tests" style="color: #fff; text-decoration: none;">Tests</a>
      </div>
      <div style="background-color: #3498db; color: #fff; padding: 10px; border-radius: 8px; margin: 16px 0;">
        <a href="${process.env.FRONTEND}/discussions" style="color: #fff; text-decoration: none;">Discussion</a>
      </div>
      <div style="background-color: #3498db; color: #fff; padding: 10px; border-radius: 8px; margin: 16px 0;">
        <a href="${process.env.FRONTEND}/discussions/news" style="color: #fff; text-decoration: none;">Tips and Tricks</a>
      </div>

      <p style="font-size:16px;margin-top:16px">Stay connected with us on:</p>
      <div>
        <a href="${process.env.MEDLOCUS_TG_URL}" style="margin-right: 16px; text-decoration: none;"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><path fill="#FF0000" d="M23.82 7.01a3.18 3.18 0 00-2.25-2.25C19.14 4.5 15 4.5 15 4.5s-4.14 0-6.57.26c-.82.13-1.52.44-2.17.85a3.18 3.18 0 00-1.13 1.31C4.23 8.86 4 13.5 4 13.5s.23 4.64.13 5.14a3.18 3.18 0 001.13 1.31c.65.41 1.35.72 2.17.85C10.86 25.5 15 25.5 15 25.5s4.14 0 6.57-.26c.82-.13 1.52-.44 2.17-.85.6-.39 1.06-.88 1.13-1.31.1-.5.13-5.13.13-5.13s-.03-4.65-.13-5.15zM12 20l5-3-5-3z"/></svg></a>
        <a href="${process.env.MEDLOCUS_YT_URL}" style="text-decoration: none;"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><path fill="#0088CC" d="M15 30c8.284 0 15-6.716 15-15S23.284 0 15 0 0 6.716 0 15s6.716 15 15 15zm-3.965-10.528c-.407.053-.788.174-1.123.378-.217.12-.417.27-.592.445l-3.046 3.046 7.397.001-3.636-3.637c-.28-.28-.624-.465-1.001-.53zm6.712-4.095c-.555 0-1.034-.175-1.438-.51-.173-.146-.333-.317-.476-.501l-5.784-5.782-.001 5.58 5.223 5.224c.146.146.315.267.5.438.4.404.576.883.576 1.438 0 .51-.176.97-.53 1.387-.323.36-.698.611-1.123.752a2.4 2.4 0 01-1.006.053 2.43 2.43 0 01-1.505-1.125l-2.084-3.697-1.438 1.439 2.527 4.455c.162.274.226.604.188.95-.039.438-.203.86-.488 1.246a1.773 1.773 0 01-1.25.514 1.7 1.7 0 01-1.237-.514c-.285-.386-.449-.808-.488-1.246-.038-.345.026-.676.188-.95l2.526-4.455-1.438-1.44-2.084 3.698c-.292.51-.727.897-1.25 1.125a2.39 2.39 0 01-1.005-.053c-.425-.141-.8-.392-1.123-.753-.353-.418-.53-.877-.53-1.387 0-.554.176-1.033.53-1.438.142-.174.313-.334.5-.479l5.223-5.223c.144-.145.31-.263.477-.437.405-.405.58-.884.58-1.437 0-.555-.175-1.034-.53-1.438-.146-.146-.316-.267-.5-.438l-5.784-5.782c-.147-.146-.308-.317-.476-.445a2.075 2.075 0 00-1.123-.377 2.12 2.12 0 00-1.438.53l-6.105 6.105a.707.707 0 00-.204.413.698.698 0 00.204.412l1.418 1.418a.734.734 0 00.412.204c.154 0 .286-.068.394-.204l2.832-2.83 6.17 6.169a2.12 2.12 0 001.437.529z"/></svg></a>
      </div>

      <p style="font-size:16px;margin-top:16px">We can't wait to have you on board!</p>
    </div>
  </div>`;

    try {
      const send_email = await sendEmail(subject, email, html);
      console.log(`Confirmation email sent to ${email}`);
    } catch (error) {
      if (error.message.includes("Invalid recipient")) {
        console.log(`Wrong email address: ${email}`);
      } else {
        return res.status(201).json({
          message: "confirmation email not sent",
        });
      }
    }

    return res.status(201).json({
      message: "confirmation email sent successfully",
    });
  } catch (error) {
    return res.status(501).json({
      message: error.message,
    });
  }
});

module.exports = router
module.exports.sendEmail = sendEmail;
module.exports.LOGO_URL = LOGO_URL;

/* 
<a href="${process.env.BASE_URL}/confirmemail?u=${id}&k=${verificationkey}&v=${verificationid}" style="font-size:16px;color:#007BFF;text-decoration:none">Confirm Email</a>
*/
