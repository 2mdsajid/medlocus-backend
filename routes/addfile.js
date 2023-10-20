const express = require("express");
const router = express();

const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // Destination folder for uploaded files
const fs = require("fs");
const Question = require("../schema/question"); // Import the Question model
const Botany = require("../schema/botany");
const Zoology = require("../schema/zoology");
const Physics = require("../schema/physics");
const Chemistry = require("../schema/chemistry");
const Mat = require("../schema/mat");
const Admin = require("../schema/admin");
const { VerifyUser, VerifyAdmin } = require("../middlewares/middlewares");

const getModelBasedOnSubject = (subject) => {
  let SubjectModel;
  switch (subject) {
    case "botany":
      SubjectModel = Botany;
      break;
    case "zoology":
      SubjectModel = Zoology;
      break;
    case "physics":
      SubjectModel = Physics;
      break;
    case "chemistry":
      SubjectModel = Chemistry;
      break;
    case "mat":
      SubjectModel = Mat;
      break;
    default:
      // Handle invalid subject
      return "zoology";
  }

  return SubjectModel;
};

const answersValues = ["a", "b", "c", "d"];

const assignTopic = async (questions, topic, subject) => {
  try {
    questions.forEach((question) => {
      question.sub = subject;
      question.topic = topic;
    });
    return questions;
  } catch (jsonParseError) {
    console.error("Error assigning unit:", jsonParseError);
  }
};

const assignUnit = async (questions, addedby, mergedunit, sub) => {
  try {
    const assignedUnits = [];
    for (const question of questions) {
      try {
        question.mergedunit = mergedunit;
        const currentDate = new Date(); // Get the current date and time
        assignedUnits.push({
          question: question.qn,
          options: question.options,
          answer: question.ans,
          subject: question.sub,
          chapter: question.topic,
          mergedunit: question.mergedunit,
          explanation: question.explanation,
          difficulty: question.difficulty ? question.difficulty[0] : "m",
          isadded: {
            state: true,
            by: addedby,
          },
          isverified: {
            state: true,
            by: addedby,
            date: currentDate,
          },
        });
      } catch (error) {
        console.error(error);
      }
    }
    return assignedUnits;
  } catch (error) {
    console.error("Error assigning unit:", error);
  }
};

const checkCompatibility = (question) => {
  if (
    !question ||
    typeof question.qn !== "string" ||
    question.qn.trim() === ""
  ) {
    return false;
  }
  if (!question.options || typeof question.options !== "object") {
    return false;
  }
  if (
    !question.options.hasOwnProperty("a") ||
    !question.options.hasOwnProperty("b") ||
    !question.options.hasOwnProperty("c") ||
    !question.options.hasOwnProperty("d") ||
    typeof question.options.a !== "string" ||
    typeof question.options.b !== "string" ||
    typeof question.options.c !== "string" ||
    typeof question.options.d !== "string"
  ) {
    return false;
  }
  if (
    !question.ans ||
    typeof question.ans !== "string" ||
    !["a", "b", "c", "d"].includes(question.ans)
  ) {
    return false;
  }

  return true;
};

router.post(
  "/uploadjson",
  upload.single("jsonFile"),
  VerifyAdmin,
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ mesage: "No file uploaded." });
    }

    const subject = req.body.subject;
    const mergedunit = req.body.unit;
    const topic = req.body.chapter;
    const addedby = req.user.uuid;
    fs.readFile(req.file.path, "utf8", async (err, data) => {
      if (err) {
        return res.status(500).send("Error reading the uploaded file.");
      }
      try {
        const jsonData = JSON.parse(data);
        const incompatibleQuestions = jsonData.filter(
          (question) => !checkCompatibility(question)
        );
        if (incompatibleQuestions.length > 0) {
          return res.status(400).json({
            message: `${incompatibleQuestions.length} Incompatible questions found. Please refer the docs fro compatibility`,
          });
        }
        const assignedTopics = await assignTopic(jsonData, topic, subject);
        const assignedUnits = await assignUnit(
          assignedTopics,
          addedby,
          mergedunit,
          subject
        );
        const newQuestions = await Question.insertMany(assignedUnits);
        const questionsBySubject = {};
        newQuestions.forEach((question) => {
          const subject = question.subject;
          if (!questionsBySubject[subject]) {
            questionsBySubject[subject] = [];
          }
          questionsBySubject[subject].push({
            mergedunit: question.mergedunit,
            chapter: question.chapter,
            questionid: question._id,
          });
        });

        // Iterate through the subject models and insert the grouped questions
        const SubjectModels = [...new Set(newQuestions.map((q) => q.subject))];
        for (const model of SubjectModels) {
          const SubjectModel = getModelBasedOnSubject(model);
          const subjectQuestions = questionsBySubject[model];
          if (subjectQuestions && subjectQuestions.length > 0) {
            await SubjectModel.insertMany(subjectQuestions);
            console.log(
              ` ${model} - ${assignedUnits.length} questions inserted successfully.`
            );
          }
        }

        const admin = await Admin.findOne({ uuid: newQuestions[0].isadded.by });
        admin.questions = admin.questions + assignedUnits.length;
        await admin.save();
        fs.unlink(req.file.path, (error) => {
          if (error) return console.log("unlinked the file error");
        });
        res.status(200).json({
          message: ` ${subject} - ${topic} - ${mergedunit} - ${assignedUnits.length} questions - By ${req.user.name} --  added.`,
        });
      } catch (error) {
        res.status(400).json({
          message: error.message,
        });
      }
    });
  }
);

router.post(
  "/checkcompatibility",
  upload.single("jsoncheck"),
  VerifyAdmin,
  (req, res) => {
    fs.readFile(req.file.path, "utf8", (err, data) => {
      if (err) {
        return res.status(500).send("Error reading the uploaded file.");
      }
      try {
        const jsonData = JSON.parse(data);
        const incompatibleQuestions = jsonData.filter(
          (question) => !checkCompatibility(question)
        );
        if (incompatibleQuestions.length > 0) {
          res.status(400).json({
            message: `${incompatibleQuestions.length} Incompatible questions found`,
            incompatibleQuestions,
          });
        } else {
          res.status(200).json({
            message: "All questions are compatible.",
            numberofquestions: jsonData.length,
          });
        }
        return fs.unlink(req.file.path, (error) => {
          if (error) return console.log("unlinked the file");
        });
      } catch (error) {
        res.status(400).json({
          message: error.message,
        });
      }
    });
  }
);

module.exports = router;
