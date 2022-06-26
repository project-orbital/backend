const express = require("express");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const https = require("https");
const fs = require("fs");

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
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);
app.use(cookieParser());
app.use(passport.initialize());

// Routes
app.use("/users/sign-in", require("./routes/users/signIn"));
app.use("/users/sign-out", require("./routes/users/signOut"));
app.use("/users/sign-up", require("./routes/users/signUp"));
app.use("/users/authenticate", require("./routes/users/authenticate"));
app.use("/verify", require("./routes/verify"));
app.use("/request-password-reset", require("./routes/requestPasswordReset"));
app.use("/reset-password", require("./routes/resetPassword"));
app.use("/api/upload", require("./routes/upload"));

// Server
if (process.env.NODE_ENV === "production") {
    const privateKey = fs.readFileSync(process.env.PRIVATE_KEY_PATH, "utf8");
    const certificate = fs.readFileSync(process.env.CERTIFICATE_PATH, "utf8");
    const ca = fs.readFileSync(process.env.CHAIN_PATH, "utf8");

    const credentials = {
        key: privateKey,
        cert: certificate,
        ca: ca,
    };

    const httpsServer = https.createServer(credentials, app);
    httpsServer.listen("8443", () => {
        console.log("Server started at https://dollarplanner.live:8443.");
    });
} else {
    app.listen(4000, () => {
        console.log("Server started on port 4000.");
    });
}
