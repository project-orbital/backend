const mongoose = require("mongoose");
const express = require("express");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");

const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const User = require("./models/user");
const UserVerification = require("./models/userVerification");
const app = express();

require("dotenv").config();

//for email verification
//email handler
const nodemailer = require("nodemailer");

//path for static verified page
const {v4: uuidv4} = require("uuid");
const PasswordReset = require("./models/passwordReset");

//Nodemailer stuff.
let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
    }
});
transporter.verify((error, success) => {
    if (error) {
        console.log(error);
    } else {
        console.log("Ready for messages");
        console.log(success);
    }
});

// === === ===
// Database.
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

// === === ===
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

// === === ===
// Routes
app.post("/sign-in", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) throw err;
        if (!user) {
            res.status(401).send("Incorrect username/password.");

        } else {
            // checks if verified
            req.logIn(user, (err) => {
                if (err) throw err;
                res.send("Signed in successfully.");
                console.log(req.user);
            });
        }
    })(req, res, next);
});

app.post("/sign-up", (req, res) => {
    const email = req.body.email;
    User.find({email})
        .then((result) => {
            if (result.length) {
                //the username alr exists
                if (!result[0].verified) {
                    let message = "Account registered with the email already exists.";
                    res.status(500).send(message);
                } else {
                    let message = "Please check your email to verify your account";
                    res.status(500).send(message);
                }
            } else {
                bcrypt.hash(req.body.password, 10)
                    .then((hashedPassword) => {
                        const newUser = new User({
                            firstName: req.body.firstName,
                            lastName: req.body.lastName,
                            email: req.body.email,
                            username: req.body.username,
                            password: hashedPassword,
                            verified: false,
                        });
                        newUser.save().then(result => {
                            //handle account verification
                            sendVerificationEmail(result, res);
                        });
                    });
            }
        })
});

const sendVerificationEmail = ({_id, email}, res) => {
    //url to be used in the email
    const currentUrl = "http://localhost:3000/"
    const uniqueString = uuidv4() + _id;
    const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Verify your Email with DollarPlanner",
        html: `<p>Verify your email address to complete the signup and login to your account.</p>
                <p>This link expires in 6 hours.</p>
                <p>Click <a href = ${currentUrl + "verify/" + _id + "/" + uniqueString
        }>here</a> to verify.</p>`,
    };

    const saltRounds = 10;
    bcrypt
        .hash(uniqueString, saltRounds)
        .then((hashedUniqueString) => {
            const newVerification = new UserVerification({
                userId: _id,
                uniqueString: hashedUniqueString,
                dateCreated: Date.now(),
                dateExpired: Date.now() + 2160000,
            });

            newVerification
                .save()
                .then(() => {
                    transporter
                        .sendMail(mailOptions)
                        .then(() => {
                            res.json({
                                status: "PENDING",
                                message: "Verification email sent",
                            })
                        })
                        .catch((error) => {
                            console.log(error);
                            return res.json({
                                status: "FAILED",
                                message: "Verification email failed",
                            })
                        })
                })
        })
        .catch(() => {
            return res.json({
                status: "FAILED",
                message: "An error occurred while hashing mail data",
            })
        });
}

//verify email
app.post("/verify", (req, res) => {
    let userId = req.body.userId;
    let uniqueString = req.body.uniqueString;

    UserVerification
        .find({userId})
        .then((result) => {
            if (result.length > 0) {
                //success
                const {dateExpired} = result[0];
                const hashedUniqueString = result[0].uniqueString;

                if (dateExpired < Date.now()) {
                    //record expired
                    UserVerification
                        .deleteOne({userId})
                        .then((result) => {
                            User
                                .deleteOne({_id: userId})
                                .then(() => {
                                    let message = "Your verification link has expired";
                                    res.send(message);
                                })
                        })
                        .catch((error) => {
                            console.log(error);
                            let message = "Clearing user with expired unique string failed";
                            res.status(500).send(message);
                        })
                } else {
                    //valid record exists
                    bcrypt.compare(uniqueString, hashedUniqueString)
                        .then(result => {
                            if (result) {
                                User
                                    .updateOne({_id: userId}, {verified: true})
                                    .then(() => {
                                        UserVerification
                                            .deleteOne({userId})
                                            .then(() => {
                                                console.log("Email verified.");
                                                let message = "Your email has been verified.";
                                                res.send(message);
                                            })
                                            .catch(error => {
                                                console.log(error);
                                                let message = "An error occurred while finalising successful verification";
                                                res.status(500).send(message);
                                            })
                                    })
                                    .catch(error => {
                                        console.log(error);
                                        let message = "An error occurred while updating user record to show verified";
                                        res.status(500).send(message);
                                    })
                            } else {
                                //existing record but incorrect verification details
                                let message = "Invalid verification details passed. Check the link in your inbox again.";
                                res.status(500).send(message);
                            }
                        })
                        .catch((error) => {
                            let message = "An error occurred while comparing unique strings.";
                            res.status(500).send(message);
                        })
                }
            } else {
                //user verification doesn't exist in records
                let message = "Your account doesn't not exist or has been verified, please sign up or sign in.";
                res.status(500).send(message);
            }
        })
        .catch((error) => {
            console.log(error);
            let message = "An error has occurred";
            res.status(500).send(message);
        })
})

app.post("/request-password-reset", (req, res) => {
    const email = req.body.email;

    //check if email exists
    User
        .find({email})
        .then((data) => {
            if (data.length) {
                //user exists
                //check if user is verified
                if (!data[0].verified) {
                    let message = "Email has not been verified yet. Check your inbox.";
                    res.status(500).send(message);
                } else {
                    sendResetEmail(data[0], res);
                }
            } else {
                let message = "No account with the supplied email exists!";
                res.status(500).send(message);
            }
        })
        .catch(error => {
            console.log(error);
        })

    const sendResetEmail = ({_id, email}, res) => {
        const resetString = uuidv4() + _id;
        const currentUrl = "http://localhost:3000/"

        //clear all existing reset records
        PasswordReset.deleteMany({userId: _id})
            .then(result => {
                //mail options
                const mailOptions = {
                    from: process.env.AUTH_EMAIL,
                    to: email,
                    subject: "Password Reset",
                    html: `
                    <p>This link expires in 60 minutes.</p>
                    <p>Click <a href = ${currentUrl + "reset-password/" + _id + "/" + resetString
                    }>here</a> to reset your password.</p>`,
                };

                //hash the reset string
                const saltRounds = 10;
                bcrypt
                    .hash(resetString, saltRounds)
                    .then((hashedResetString) => {
                        const newPasswordReset = new PasswordReset({
                            userId: _id,
                            resetString: hashedResetString,
                            dateCreated: Date.now(),
                            dateExpired: Date.now() + 3600000,
                        })

                        newPasswordReset
                            .save()
                            .then(() => {
                                transporter
                                    .sendMail(mailOptions)
                                    .then(() => {
                                        res.json({
                                            status: "PENDING",
                                            message: "Password reset email sent",
                                        });
                                    })
                                    .catch(error => {
                                        res.json({
                                            status: "FAILED",
                                            message: "error sending email",
                                        });
                                    })
                            })
                            .catch(error => {
                                res.json({
                                    status: "FAILED",
                                    message: "Cannot save password reset data",
                                });
                            })
                    })
                    .catch(error => {
                        res.json({
                            status: "FAILED",
                            message: "Clearing existing password reset records failed!",
                        });
                    })
            })
            .catch(error => {
                res.json({
                    status: "FAILED",
                    message: "Clearing existing password reset records failed!",
                });
            })
    }
})

app.post("/reset-password", (req, res) => {
    let userId = req.body.userId;
    let resetString = req.body.resetString;
    let newPassword = req.body.password;

    PasswordReset
        .find({userId})
        .then(result => {
            if (result.length > 0) {
                //password reset record exists
                const {dateExpired} = result[0];
                const hashedResetString = result[0].resetString;

                if (dateExpired < Date.now()) {
                    PasswordReset
                        .deleteOne({userId})
                        .then(() => {
                            let message = "Password reset link has expired.";
                            res.status(500).send(message);
                        })
                        .catch((error) => {
                            console.log(error);
                            let message = "Clearing password reset record failed.";
                            res.status(500).send(message);
                        })
                } else {
                    //valid reset record exists so we validate the reset string
                    //first compare the hashed reset string
                    bcrypt
                        .compare(resetString, hashedResetString)
                        .then(result => {
                            if (result) {
                                //strings matched
                                //hash passwords again
                                bcrypt
                                    .hash(newPassword, 10)
                                    .then(hashedNewPassword => {
                                        // update user password
                                        User
                                            .updateOne({_id: userId}, {password: hashedNewPassword})
                                            .then(() => {
                                                //update complete. now delete reset record
                                                PasswordReset
                                                    .deleteOne({userId})
                                                    .then(() => {
                                                        let message = "Password has been reset successfully";
                                                        res.send(message);
                                                    })
                                                    .catch((error) => {
                                                        console.log(error);
                                                        let message = "Error occurred hashing the password";
                                                        res.status(500).send(message);
                                                    });
                                            })
                                            .catch((error) => {
                                                console.log(error);
                                                let message = "Update user password failed";
                                                res.status(500).send(message);
                                            })
                                    })
                                    .catch((error) => {
                                        console.log(error);
                                        let message = "Error occurred hashing the password";
                                        res.status(500).send(message);
                                    })
                            } else {
                                let message = "Invalid password reset details passed";
                                res.status(500).send(message);
                            }
                        })
                        .catch((error) => {
                            console.log(error);
                            let message = "Checking for existing password reset record failed.";
                            res.status(500).send(message);
                        })
                }
            } else {
                //password reset record doesnt exist
                let message = "Password reset record doesnt exist.";
                res.status(500).send(message);
            }
        })
        .catch((error) => {
            console.log(error);
            let message = "Checking for existing password reset record failed.";
            res.status(500).send(message);
        })
})
const multer = require('multer');
const extractor = require('./utils/pdf')
const parser = require('../parser/pkg');
app.post('/api/upload', multer().array('files'), async (req, res, next) => {
        const json = await extractor.extract(req.files)
            .then(parser.parse)
            .catch(err => {
                console.log(err);
                return "[]";
            });
        res.send(json);
    }
);

// ===
// Server
app.listen(4000, () => {
    console.log("Server started on port 4000.");
})
