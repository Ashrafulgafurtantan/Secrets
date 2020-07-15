//jshint esversion:6
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
var lodash = require("lodash");
const mongoose = require("mongoose");

const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();
mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//.........Starting file.............//
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    require: true,
  },
  password: {
    type: String,
    require: true,
  },
});

const User = new mongoose.model("User", userSchema);

app.get("/", function (req, res) {
  res.render("home");
});
app.get("/:path", function (req, res) {
  if (req.params.path === "login") {
    res.render("login");
  } else {
    res.render("register");
  }
});

app.post("/register", function (req, res) {
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    const user = new User({
      username: req.body.username,
      password: hash,
    });
    user.save(function (err) {
      if (!err) {
        res.render("secrets");
      } else {
        res.send("Registration problem");
      }
    });
  });
});
app.post("/login", function (req, res) {
  const username = req.body.username;
  const password = req.body.password;
  User.findOne({ username: username }, function (err, founduser) {
    if (err) {
      console.log("Problem occured");
    } else {
      bcrypt.compare(password, founduser.password, function (err, result) {
        if (result === true) {
          res.render("secrets");
        }
      });
    }
  });
});
//...............Listening Port...............//
app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});
/*  email:"bsse1021@iit.du.ac.bd",
    password : "01191752075", */
