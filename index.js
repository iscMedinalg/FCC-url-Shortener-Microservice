require('dotenv').config();
const express = require('express');
/* Requerimos importar Mongoose */
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

/* Create the key from MongoDB with user, password and database name */
const MONGO_URI = "mongodb+srv://YouUserHere:YouPasswordHere@cluster0.h504h.mongodb.net/YouDatabaseHere?retryWrites=true&w=majority";
// Connect with database
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
//create a variable to Schema. This step could be omited if you used mongoose.Schema
const Schema = mongoose.Schema;
//create a new Schema to urls
let urlSchema = new Schema({
  original : {
    type: String, 
    required: true
  },
  short: {
    type: Number
  }
});
//create a new model
const urlModel = mongoose.model('URL', urlSchema)
//import body-parser
let bodyParser = require('body-parser')
//create a new object from save json data
let responseObject = {}
//create a post with url, parser and the middleware
app.post('/api/shorturl', bodyParser.urlencoded({ extended: false}), function(req, res){
  //get url
  let urlLink = req.body.url
  // create a new Regular Expresion to validate the url links are correct
  let Regex = new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi)

  //Compare the url with the regex
  if (!urlLink.match(Regex)){
    res.json({error: 'Invalid URL'})
    return
  }
  // return url
  responseObject['original_url'] = urlLink
  let shortUrl = 1 

  // use the model for insert data in the database
  urlModel
  .findOne({})
  .sort({short: "desc"})
  .exec((error, result) => {
    if(!error && result != undefined){
      shortUrl = result.short + 1
    }
    if(!error){
      urlModel.findOneAndUpdate(
        {original: urlLink },
        {original: urlLink, short: shortUrl},
        {new: true, upsert: true},
        (error, savedUrl) => {
          if(!error){
            responseObject["short_url"] = savedUrl.short
            res.json(responseObject)
          }
        }
      )
    }
  })

})

//validate the url short for redirect to original link
app.get('/api/shorturl/:urlShort', (req, res) => {
  let urlShort = req.params.urlShort
  urlModel.findOne({short: urlShort}, (error, result) => {
    if(!error && result != undefined){
      res.redirect(result.original)
    } else {
      res.json({error: 'URL Not Found'})
    }
  })
})