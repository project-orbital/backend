const express = require("express");
const passport = require("passport");
const cors = require("cors");

// Setup
require("dotenv").config();
require("./config/database");
require("./config/passport")(passport);

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
        origin: "http://localhost:3000", // <-- location of the react app were connecting to
        credentials: true,
    })
);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/sign-in", require("./routes/signIn"));
app.use("/sign-up", require("./routes/signUp"));
app.use("/verify", require("./routes/verify"));
app.use("/request-password-reset", require("./routes/requestPasswordReset"));
app.use("/reset-password", require("./routes/resetPassword"));
app.use("/api/upload", require("./routes/upload"));

// Server
app.listen(4000, () => {
    console.log("Server started on port 4000.");
});
