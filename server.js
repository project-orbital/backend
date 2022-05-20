const mongoose = require("mongoose");
const express = require("express");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");

const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const User = require("./user");
const app = express();

require("dotenv").config();
mongoose.connect(
    process.env.DATABASE_URI,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    },
    () => {
        console.log("Database connected.");
    }
);

// ===
// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(
    cors({
        origin: "http://localhost:3000", // <-- location of the react app were connecting to
        credentials: true,
    })
);
app.use(
    session({
        secret: process.env.SESSION_COOKIE_SECRET,
        resave: true,
        saveUninitialized: true,
    })
);
app.use(cookieParser(process.env.SESSION_COOKIE_SECRET));
app.use(passport.initialize());
app.use(passport.session());
require("./passportConfig")(passport);

// ===
// Routes
app.post("/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) throw err;
        if (!user) res.send("Invalid username/password.");
        else {
            req.logIn(user, (err) => {
                if (err) throw err;
                res.send("Sign in successful.");
                console.log(req.user);
            });
        }
    })(req, res, next);
});

app.post("/register", (req, res) => {
    User.findOne({username: req.body.username}, async (err, doc) => {
        if (err) throw err;
        if (doc) res.send("User already exists.");
        if (!doc) {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            const newUser = new User({
                username: req.body.username,
                password: hashedPassword,
            });
            await newUser.save();
            res.send("Sign up successful.");
        }
    });
});

app.get("/user", (req, res) => {
    res.send(req.user);
});

// ===
// Server
app.listen(4000, () => {
    console.log("Server started on port 4000.");
});
