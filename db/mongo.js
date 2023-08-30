const mongoose = require("mongoose")

// DeprecationWarning:
mongoose.set('strictQuery', true)

const DB = `mongodb+srv://2mdsajid:${process.env.MONGOPASS}@cluster0.ck446sw.mongodb.net/medlocus2?retryWrites=true&w=majority`

mongoose.connect(DB).then(()=>{
    console.log('connected successfully to medlocus database');
}).catch((err)=>{console.log('error while connecting to medlocus database')})


// 

module.exports = mongoose.connection;