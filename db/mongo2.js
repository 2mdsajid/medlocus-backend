const mongoose = require("mongoose")

// DeprecationWarning:
mongoose.set('strictQuery', true)


const DB2 = `mongodb+srv://2mdsajid:${process.env.MONGOPASS2}@cluster0.ac6v25v.mongodb.net/medlocus3?retryWrites=true&w=majority`
mongoose.connect(DB2).then(()=>{
    console.log('connected successfully to medlocus2 database');
}).catch((err)=>{console.log('error while connecting to medlocus2 database')})

module.exports = mongoose.connection