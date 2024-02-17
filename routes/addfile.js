const express = require("express");
const router = express();

const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // Destination folder for uploaded files
const fs = require("fs");
const Question = require("../schema/question");
const PastQuestion = require("../schema/pastquestion");
const Admin = require("../schema/admin");
const { VerifyUser, VerifyAdmin } = require("../middlewares/middlewares");
const CustomTest = require("../schema/customtests");
const Organization = require("../schema/organization");

const stopWords = [
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "is",
  "are",
  "am",
  "was",
  "were",
  "be",
  "being",
  "been",
  "to",
  "in",
  "on",
  "at",
  "for",
  "with",
  "by",
  "of",
  "about",
  "through",
  "into",
  "during",
  "before",
  "after",
  "above",
  "below",
  "under",
  "over",
  "between",
  "among",
  "along",
  "across",
  "off",
  "down",
  "up",
  "out",
  "into",
  "around",
  "through",
  "from",
  "behind",
  "beside",
  "near",
  "next",
  "between",
  "beyond",
  "within",
  "without",
  "along",
  "behind",
  "beside",
  "between",
  "by",
  "in",
  "inside",
  "into",
  "like",
  "near",
  "of",
  "off",
  "on",
  "onto",
  "out",
  "outside",
  "over",
  "through",
  "to",
  "under",
  "up",
  "upon",
  "with",
];

function removeStopWords(sentence) {
  return sentence
    .split(" ")
    .filter((word) => !stopWords.includes(word))
    .join(" ");
}
function cosineSimilarity(sentence1, sentence2) {
  const words1 = removeStopWords(sentence1).split(" ");
  const words2 = removeStopWords(sentence2).split(" ");
  const uniqueWords = new Set([...words1, ...words2]);
  const vector1 = Array.from(uniqueWords).map((word) =>
    words1.includes(word) ? 1 : 0
  );
  const vector2 = Array.from(uniqueWords).map((word) =>
    words2.includes(word) ? 1 : 0
  );
  const dotProduct = vector1.reduce(
    (accumulator, value, index) => accumulator + value * vector2[index],
    0
  );
  const magnitude1 = Math.sqrt(
    vector1.reduce((acc, value) => acc + value * value, 0)
  );
  const magnitude2 = Math.sqrt(
    vector2.reduce((acc, value) => acc + value * value, 0)
  );
  const similarity = dotProduct / (magnitude1 * magnitude2);

  return similarity;
}

const findSimilarQuestionsFromArray = (inputData, matchingQuestions) => {
  const inputQuestions = inputData.map((question) => question.question);
  const questionValues = matchingQuestions.map((question) => question.question);
  const similarityResults = [];
  for (const inputQuestion of inputData) {
    for (const questionValue of matchingQuestions) {
      const similarity = cosineSimilarity(inputQuestion.question, questionValue.question);

      // Include only pairs with similarity greater than 40%
      if (similarity > 0.4) {
        similarityResults.push({
          yourQuestion: JSON.stringify(inputQuestion),
          databaseQuestion: JSON.stringify(questionValue),
          similarity: Math.round(similarity * 100) + "%",
        });
      }
    }
  }

  similarityResults.sort((a, b) => b.similarity - a.similarity);

  return similarityResults;
};


const answersValues = ["a", "b", "c", "d"];
const yearPattern = /\s*\[\d{4}\]/g;
function removeYearPattern(str) {
  return str.replace(yearPattern, "");
}

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
const assignYearAndAffiliation = async (questions, year, affiliation, addedby) => {
  try {
    const assignedUnits = [];
    for (const question of questions) {
      assignedUnits.push({
        question: removeYearPattern(question.qn),
        options: question.options,
        answer: question.ans,
        explanation: question.explanation,
        images: question.images || {
          qn: "",
          a: "",
          b: "",
          c: "",
          d: "",
          exp: "",
        },
        yr: year,
        af: affiliation,
        isadded: {
          state: true,
          by: addedby,
        },
      });
    }
    return assignedUnits;
  } catch (error) {
    console.error("Error assigning unit:", error);
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
          question: removeYearPattern(question.qn),
          options: question.options,
          answer: question.ans,
          subject: question.sub,
          chapter: question.topic,
          mergedunit: question.mergedunit,
          explanation: question.explanation,
          images: question.images || {
            qn: "",
            a: "",
            b: "",
            c: "",
            d: "",
            exp: "",
          },
          difficulty: question.difficulty
            ? question.difficulty[0].toLowerCase()
            : "m",
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
  "/uploadjsondata",
  VerifyAdmin,
  async (req, res) => {
    const jsonData = JSON.parse(req.body.jsondata);
    const subject = req.body.subject;
    const mergedunit = req.body.unit;
    const topic = req.body.chapter;
    const addedby = req.user.uuid;

    if (!subject || !mergedunit || !topic) {
      return res.status(300).json({ message: 'you are missing to provide subject or chapter or unit' });
    }

    const incompatibleQuestions = await jsonData.filter(
      (question) => !checkCompatibility(question)
    );
    if (incompatibleQuestions.length > 0) {
      return res.status(400).json({
        message: `${incompatibleQuestions.length} Incompatible questions found. Please refer the docs fro compatibility`,
      });
    }

    // const matchingQuestions = await Question.find({
    //   subject: subject,
    //   mergedunit: mergedunit,
    //   chapter: topic,
    // });

    // const similarityResults = findSimilarQuestionsFromArray(
    //   jsonData,
    //   matchingQuestions
    // );

    // if (similarityResults.length > 0) {
    //   return res.status(200).json({
    //     message: `${similarityResults.length} Similar questions found`,
    //   });
    // }
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

    const admin = await Admin.findOne({ uuid: newQuestions[0].isadded.by });
    admin.questions = admin.questions + assignedUnits.length;
    await admin.save();

    res.status(200).json({
      message: ` ${subject} - ${topic} - ${mergedunit} - ${assignedUnits.length} questions - By ${req.user.name} --  added.`,
    });
  }
);

// add past questions
router.post("/add-past-questions", VerifyAdmin, async (req, res) => {
  try {
    const jsonData = JSON.parse(req.body.jsondata);
    const yr = req.body.year;
    const af = req.body.affiliation;
    const addedby = req.userId;
    if (!yr || !af) {
      return res.status(300).json({ message: 'you are missing to provide year or affiliation' });
    }

    const incompatibleQuestions = await jsonData.filter(
      (question) => !checkCompatibility(question)
    );

    if (incompatibleQuestions.length > 0) {
      return res.status(400).json({
        message: `${incompatibleQuestions.length} Incompatible questions found. Please refer the docs fro compatibility`,
      });
    }

    const existingTest = await CustomTest.findOne({ type: "pastpaper", testid: `${af}-${yr}` });
    if (existingTest) {
      return res.status(400).json({
        message: `This set '${af}-${yr}' already exists in past year sets.`,
      });
    }

    const assignedYearAffiliationQuestions = await assignYearAndAffiliation(jsonData, yr, af, addedby);
    const newQuestions = await PastQuestion.insertMany(assignedYearAffiliationQuestions);

    // creating the test for past questions
    const questionIds = newQuestions.map(question => question._id);
    const newCustomTest = new CustomTest({
      type: "pastpapers",
      name: `${af}-${yr}`,
      testid: `${af}-${yr}`,
      createdBy: addedby,
      questionmodel: "Pastquestion",
      questionsIds: questionIds,
    });

    await newCustomTest.save();
    // update admin for adding questions
    const admin = await Admin.findById(addedby);
    admin.questions = admin.questions + assignedYearAffiliationQuestions.length;
    await admin.save();

    return res.status(200).json({
      message: ` ${yr} - ${af} - ${assignedYearAffiliationQuestions.length} questions - By ${req.user.name} --  added.`,
    });

  } catch (error) {
    console.error("Error ", error);
    return res.status(500).json({ message: error.message });

  }
});

router.post(
  "/find-similar-questions",
  upload.single("jsonFile"),
  async (req, res) => {
    try {
      const subject = req.body.subject;
      const mergedunit = req.body.unit;
      const chapter = req.body.chapter;
      fs.readFile(req.file.path, "utf8", async (err, data) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Error reading the uploaded file." });
        }
        const inputData = JSON.parse(data);
        const matchingQuestions = await Question.find({
          subject: subject,
          mergedunit: mergedunit,
          chapter: chapter,
        }).select('_id question options answer')
        const similarityResults = findSimilarQuestionsFromArray(
          inputData,
          matchingQuestions
        );
        if (similarityResults.length > 0) {
          return res.status(400).json({
            message: `${similarityResults.length} similar questions found`,
            questions: similarityResults,
          });
        }
        fs.unlink(req.file.path, (error) => {
          if (error) return console.log("unlinked the file");
        });
        return res.status(200).json({ message: "No similar questions found" });
      });
    } catch (error) {
      console.error("Error finding similar questions:", error);
      return res.status(500).json({ message: error.message });
    }
  }
);


// add prayash left tests in custom tetss
router.post("/add-prayash-questions", VerifyAdmin, async (req, res) => {
  try {
    const jsonData = req.body.jsondata
    const testName = req.body.name
    const testid = testName.replace(/\s+/g, '-');
    const addedby = req.userId;

    if (!testName || !jsonData.length > 0) {
      return res.status(300).json({ message: 'Name or questions missing' });
    }

    const orgId = '65c4876c6797ad256fa3f5f9'
    const organization = await Organization.findById(orgId)
    const image = organization.image
    const type = organization.uniqueId


    const existingTest = await CustomTest.findOne({ type, testid });
    if (existingTest) {
      return res.status(400).json({
        message: `This test already exists in!`,
      });
    }

    const newQuestions = await Question.insertMany(jsonData);

    // creating the test for past questions
    const questionIds = newQuestions.map(question => question._id);
    const newCustomTest = new CustomTest({
      type,
      name: testName,
      testid: testid,
      createdBy: addedby,
      image: image || '',
      questionmodel: "Question",
      questionsIds: questionIds,
    });
    await newCustomTest.save();
    // update admin for adding questions
    const admin = await Admin.findOne({ _id: addedby });
    admin.questions = admin.questions + jsonData.length;
    await admin.save();

    return res.status(200).json({
      message: `${jsonData.length} questions - By ${req.user.name} --  added.`,
    });

  } catch (error) {
    console.error("Error ", error);
    return res.status(500).json({ message: error.message });
  }
});

module.checkCompatibility = checkCompatibility
module.exports = router;
