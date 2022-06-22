const mongoose = require("mongoose");
const express = require("express");
const passport = require("passport");
const bodyParser = require("body-parser");

const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const app = express();

require("dotenv").config();

// === === ===
// Database.
mongoose.connect(process.env.DATABASE_URI, () => {
    console.log("Database connected.");
});

// === === ===
// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
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
require("./config/passport")(passport);

// === === ===
// Routes
app.use("/sign-in", require("./routes/signIn"));
app.use("/sign-up", require("./routes/signUp"));
app.use("/verify", require("./routes/verify"));
app.use("/request-password-reset", require("./routes/requestPasswordReset"));
app.use("/reset-password", require("./routes/resetPassword"));
app.use("/api/upload", require("./routes/upload"));

// ===
// Server
app.listen(4000, () => {
    console.log("Server started on port 4000.");
});
