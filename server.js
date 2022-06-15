const mongoose = require("mongoose");
const express = require("express");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");

const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const User = require("./user");
const UserVerification = require("./userVerification");
const app = express();

require("dotenv").config();

//for email verification
//email handler
const nodemailer = require("nodemailer");
//path for static verified page
const path = require("path");
const {v4: uuidv4} = require("uuid");
// const res = require("express/lib/response");

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
            return;
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
    User.find({ username: req.body.username })
    .then((result) => {
        if (result.length) {
            //an user alr exists
            res.json({
                message: "Email already exists",
            });
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
    const currentUrl = "http://localhost:3000/";
    const uniqueString = uuidv4() + _id;
    const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Verify your Email with DollarPlanner",
        html: `<p>Verify your email address to complete the signup and login to your account.</p>
                <p>This link expires in 6 hours.</p>
                <p>Click <a href = ${
                    currentUrl + "email-sent/" + _id + "/" + uniqueString
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
        })

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
            message: "An error occured while hashing mail data",
        })
    });


}

//verify email
app.get("/email-sent/:userId/:uniqueString", (req, res) => {
    let {userId, uniqueString} = req.params;

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
                        res.redirect(`/verified/error=true&message=${message}`);
                    })
                })
                .catch((error) => {
                    console.log(error);
                    let message = "Clearing user with expired unique string failed";
                    res.redirect(`/verified/error=true&message=${message}`);
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
                                res.sendFile(path.join(__dirname, "./staticPages/verified.html"));
                            })
                            .catch(error => {
                                console.log(error);
                                let message = "An error occurred while finalising successful verification";
                                res.redirect(`/verified/error=true&message=${message}`);
                            })
                        })
                        .catch(error => {
                            console.log(error);
                            let message = "An error occurred while updating user record to show verified";
                                res.redirect(`/verified/error=true&message=${message}`);
                        })
                    } else {
                        //existing record but incorrect verification details
                        let message = "Invalid verifcation details passed. Check the link in your inbox again.";
                            res.redirect(`/verified/error=true&message=${message}`);
                    }
                })
                .catch((error) => {
                    let message = "An error occured while comparing unique strings.";
                        res.redirect(`/verified/error=true&message=${message}`);
                })
            }
        } else {
            //user verification doesn't exist in records
            let message = "Your account doesn't not exist or has been verified, please sign up or sign in.";
            res.redirect(`/verified/error=true&message=${message}`);
        }
    })
    .catch((error) => {
        console.log(error);
        let message = "An error has occurred";
            res.redirect(`/verified/error=true&message=${message}`);
    })
})

//verified page route
app.get("/verified", (req, res) => {
    res.sendFile(path.join(__dirname, "./staticPages/verified.html"));
})

// ===
// Server
app.listen(4000, () => {
    console.log("Server started on port 4000.");
});
