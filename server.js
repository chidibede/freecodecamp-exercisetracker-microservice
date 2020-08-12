require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require('./models/User')

mongoose.connect(
  process.env.MONGO_URI,
  { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true},
  (err) => {
    if (err) {
      console.log(`Error connecting to database...`, err);
    } else {
      console.log(`Connected to database successfully...`);
    }
  }
);

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));

// Home page route
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Create users route
app.post("/api/exercise/new-user", async (req, res) => {
  const username = req.body.username;
  if(!username){
    res.redirect('/');
  }else{
    await User.findOne({username : username}, async (err, data) => {
      if(err){
        console.log("Error retrieving user");
      } else{
        if(data){
          res.json({message: "Username exists, choose another username"})
        } else{
          await  User.create({username}, (err, data) => {
            if(err){
              res.json({error: "error creating user"})
            }else{
              res.json({_id: data._id ,username: data.username})
            }
          })
        }
      }
    });
  }

});

// Query all users
app.get('/api/exercise/users', async (req, res) => {
  await User.find((err, data) => {
    if(err){
      res.json({message: "Error retrieving users"})
    }else{
      res.json(data)
    }
  })
})

// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: "not found" });
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }
  res.status(errCode).type("txt").send(errMessage);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on localhost:${port}`);
});
