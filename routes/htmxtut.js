const express = require("express");
const router = express.Router();
router.get("/gethtml", (req, res) => {
  console.log("gotttttt");
//   return res.json({ name: "sajid" });
  const html = "<html><body><h1>Hello, World!</h1></body></html>";
  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

module.exports = router;
