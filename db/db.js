const mongoose = require("mongoose");
const DB = `mongodb+srv://2mdsajid:${process.env.MONGOPASS}@cluster0.ck446sw.mongodb.net/medlocus2?retryWrites=true&w=majority`;
const DB2 = `mongodb+srv://2mdsajid:${process.env.MONGOPASS2}@cluster0.ac6v25v.mongodb.net/medlocus3?retryWrites=true&w=majority`;

mongoose.db = mongoose.createConnection(DB, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});
mongoose.db2 = mongoose.createConnection(DB2, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

module.exports = mongoose
