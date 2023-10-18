// Importing express library and initializing app variable
let express = require('express')
const http = require('http');
let app = express()

// Set the maximum payload size to 50MB
const bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Importing dotenv library to retrieve sensitive information from the .env file
const dotenv = require('dotenv')
dotenv.config({ path: './config.env' })

// Getting the port value from the .env file or defaulting to 5000
const PORT = process.env.PORT || 3002

// Connecting to the MongoDB database
require('./db/mongo.js')

// Serving static files from the 'public' folder
app.use('/public', express.static('public'));

let cors = require('cors')
app.use(cors());

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.get('/',(req, res) => {
    res.json({msg:"bro yrr do not cause unnecessary redirect"})
})


//before AUTH.JS loading so that it effects
app.use(express.json())

// Linking the noteroute.js file to the main app
app.use(require('./routes/questionroute'))
app.use(require('./routes/userroute'))
app.use(require('./routes/tests'))
app.use(require('./routes/notesroute'))
app.use(require('./routes/analytics'))
// app.use(require('./routes/htmxtut'))
app.use(require('./routes/addfile'))

const server = http.createServer(app);

server.listen(PORT, () => console.log(`Listening on PORT ${PORT}`));
