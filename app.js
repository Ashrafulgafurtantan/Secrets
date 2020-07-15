//jshint esversion:6
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
var lodash = require("lodash");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: process.env.MY_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    console.log("user auth");
    res.render("secrets");
  } else {
    console.log("user unauth");

    res.redirect("/login");
  }
});
app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.get("/:path", function (req, res) {
  if (req.params.path === "login") {
    res.render("login");
  } else if (req.params.path === "register") {
    res.render("register");
  }
});
/*
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
*/

app.post("/register", function (req, res) {
  User.register({ username: req.body.username }, req.body.password, function (
    err,
    user
  ) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function () {
        console.log("successfully registered");
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, function (err) {
    if (err) {
      console.log("error on login");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.render("secrets");
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
