const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema({
  description: { type: String },
  duration: { type: Number },
  date: {type: String},
},
);


const userSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true },
    log: [exerciseSchema]
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
let Exercise = mongoose.model('Exercise', exerciseSchema)
module.exports = {User, Exercise};
