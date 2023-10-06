const express = require("express");
const router = express.Router();

const Note = require("../schema/note");
const {
  VerifyUser,
  VerifyAdmin,
  VerifyMedlocusAdmin,
} = require("../middlewares/middlewares");

/*  ADDING NOTES TO DATABASE */
router.post("/savenote", VerifyMedlocusAdmin, async (req, res, next) => {
  try {
    // Get the request body parameters
    const {
      id,
      title,
      noteid,
      category,
      subcategory,
      intro,
      content,
      keywords,
      readtime,
      introimage,
    } = req.body;
    console.log(
      "🚀 ~ file: notesroute.js:23 ~ router.post ~ req.body:",
      req.body
    );

    let newnote;

    if (id) {
      newnote = await Note.findById(id);
    }

    if (newnote) {
      newnote.title = title;
      newnote.noteid = noteid;
      newnote.category = category;
      newnote.subcategory = subcategory || "";
      newnote.intro = intro;
      newnote.review = false;
      newnote.published = true;
      newnote.content = content;
      newnote.keywords = keywords || "";
      newnote.readtime = readtime;
      newnote.introimage = introimage || "";
      newnote.isupdated.state = true;

      const saved = await newnote.save();
    } else {
      newnote = new Note({
        title,
        noteid,
        category,
        subcategory: subcategory || "",
        intro,
        content,
        review: false,
        published: true,
        keywords: keywords || "",
        readtime,
        introimage: introimage || "",
      });
      await newnote.save();
    }
    return res.status(200).json({
      message: "Note saved successfully",
      note: newnote,
    });
  } catch (error) {
    // Handle error response
    return res.status(500).json({
      message: "Error saving note",
      error: error.message,
    });
  }
});

/*  ADDING NOTES TO DRAFT */
router.post("/savedraft", VerifyMedlocusAdmin, async (req, res, next) => {
  // Get the request body parameters
  const {
    id,
    title,
    noteid,
    category,
    subcategory,
    intro,
    content,
    keywords,
    readtime,
    introimage,
  } = req.body;

  let newnote;

  try {
    if (id) {
      newnote = await Note.findById(id);
    }

    if (newnote) {
      newnote.title = title;
      newnote.noteid = noteid;
      newnote.category = category;
      newnote.subcategory = subcategory || "";
      newnote.intro = intro;
      newnote.review = true;
      newnote.published = false;
      newnote.content = content;
      newnote.keywords = keywords || "";
      newnote.readtime = readtime;
      newnote.introimage = introimage;
      newnote.isupdated.state = true;

      const saved = await newnote.save();
    } else {
      newnote = new Note({
        title,
        noteid,
        category,
        subcategory: subcategory || "",
        intro,
        content,
        review: true,
        published: false,
        keywords: keywords || "",
        readtime,
        introimage,
      });

      await newnote.save();
    }

    return res.status(200).json({
      message: "Note drafted successfully",
      note: newnote,
    });
  } catch (error) {
    console.log(error);
    res.status(501).json({
      message: error.message,
    });
  }
});

// Get all notes - get single note by id // query ?i=noteid
router.get("/getnotes", async (req, res) => {
  try {
    const { i, v } = req.query;
    console.log("🚀 ~ file: notesroute.js:154 ~ router.get ~ req.query:", req.query)
    if (i) {
      const note = await Note.findOne({ noteid: i }).select(
        "_id noteid title category author content introimage intro keywords readtime upvote comments date views"
      );
      if (!note) {
        return res.status(404).json({
          message: "cant find note",
        });
      }
      // to increase the views --- with same request
      if(v && v==='true'){
        note.views = note.views + 1;
        await note.save();
      }
      console.log("🚀 ~ file: notesroute.js:165 ~ router.get ~ note:", note)
      return res.status(200).json({
        note,
        message: "note fetched successfully",
      });
    }

    const notes = await Note.find({ review: false, published: true }).select(
      "_id noteid title category author introimage intro readtime date"
    );
    if (notes.length === 0) {
      return res.status(400).json({
        message: "No Notes Available",
      });
    }
    return res.status(200).json({
      notes,
      message: "note fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

// to get all the notes in the draft
router.get("/findallnotes", VerifyMedlocusAdmin, async (req, res) => {
  try {
    const { i } = req.query;
    console.log("🚀 ~ file: notesroute.js:192 ~ router.get ~ i:", i);
    if (i) {
      const note = await Note.findOne({ _id: i });
      if (!note) {
        return res.status(404).json({
          message: "cant find note",
        });
      }
      return res.status(200).json({
        note,
        message: "note fetched successfully",
      });
    }

    const notes = await Note.find();
    if (!notes) {
      return res.status(400).json({
        message: "Unable to fetch the draft notes",
      });
    }
    return res.status(200).json({
      notes,
      message: "Draft notes fetched successfully",
    });
  } catch (error) {
    return res.status(501).json({
      message: error.message,
    });
  }
});

// add views
router.post("/addviews", async (req, res) => {
  try {
    const { id } = req.body;
    const note = await Note.findOne({ _id: id });
    if (!note) {
      return null;
    }
    note.views = note.views + 1;
    await note.save();
    return res.status(201).json({
      message: "voted successfully",
    });
  } catch (error) {
    return res.status(501).json({
      message: error.message,
    });
  }
});

module.exports = router;
