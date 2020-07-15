//jshint esversion:6
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
var lodash = require("lodash");
const mongoose = require("mongoose");

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const findOrCreate = require("mongoose-findorcreate");
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
  googleId: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile.displayName);
      User.findOrCreate(
        { googleId: profile.id, username: profile.displayName },
        function (err, user) {
          return cb(err, user);
        }
      );
    }
  )
);

app.get("/", function (req, res) {
  res.render("home");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);

app.get("/submit", function (req, res) {
  res.render("submit");
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
