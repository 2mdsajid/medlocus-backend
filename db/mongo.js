const mongoose = require("mongoose")

// DeprecationWarning:
mongoose.set('strictQuery', true)

const DB = process.env.DB

mongoose.connect(DB).then(()=>{
    console.log('connected successfully to medlocus database');
}).catch((err) => {
    console.log('error while connecting to medlocus database',err)
})

module.exports = mongoose.connection;