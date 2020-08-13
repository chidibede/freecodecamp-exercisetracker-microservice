require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const { User, Exercise } = require("./models/User");

mongoose.connect(
  process.env.MONGO_URI,
  { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true },
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
  if (!username) {
    res.redirect("/");
  } else {
    await User.findOne({ username: username }, async (err, data) => {
      if (err) {
        console.log("Error retrieving user");
      } else {
        if (data) {
          res.json({ message: "Username exists, choose another username" });
        } else {
          await User.create({ username }, (err, data) => {
            if (err) {
              res.json({ error: "error creating user" });
            } else {
              res.json({ _id: data._id, username: data.username });
            }
          });
        }
      }
    });
  }
});

// Query all users
app.get("/api/exercise/users", async (req, res) => {
  await User.find((err, data) => {
    if (err) {
      res.json({ message: "Error retrieving users" });
    } else {
      res.json(data);
    }
  });
});

app.post("/api/exercise/add", async (req, res) => {
  const description = req.body.description;
  const duration = req.body.duration;
  const userId = req.body.userId;

  let newExerciseItem = new Exercise({
    description: description,
    duration: parseInt(duration),
    date: req.body.date,
  });

  if (newExerciseItem.date === "") {
    newExerciseItem.date = new Date().toISOString().substring(0,10)
  } 
  console.log(newExerciseItem);

  await User.findOneAndUpdate(
    { _id: userId },
    { $addToSet: { log: newExerciseItem } },
    { new: true, useFindAndModify: false },
    (err, data) => {
      if (err) {
        res.json({ message: "Error finding user" });
      } else {
        res.json({
          _id: data._id,
          username: data.username,
          description: newExerciseItem.description,
          duration: newExerciseItem.duration,
          date: new Date(newExerciseItem.date).toDateString()
        });
      }
    }
  );
});

app.get("/api/exercise/log", async (req, res) => {
  User.findById(req.query.userId, (error, result) => {
    if(!error){
      let responseObject = result
      
      if(req.query.from || req.query.to){
        
        let fromDate = new Date(0)
        let toDate = new Date()
        
        if(req.query.from){
          fromDate = new Date(req.query.from)
        }
        
        if(req.query.to){
          toDate = new Date(req.query.to)
        }
        
        fromDate = fromDate.getTime()
        toDate = toDate.getTime()
        
        responseObject.log = responseObject.log.filter((exercises) => {
          let exercisesDate = new Date(exercises.date).getTime()
          
          return exercisesDate >= fromDate && exercisesDate <= toDate
          
        })
        
      }
      
      if(req.query.limit){
        responseObject.log = responseObject.log.slice(0, req.query.limit)
      }
      
      responseObject = responseObject.toJSON()
      responseObject['count'] = result.log.length
      res.json(responseObject)
    }
  
})

});

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
