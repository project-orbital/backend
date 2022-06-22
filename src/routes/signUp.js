const express = require("express");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const UserVerification = require("../models/userVerification");
const router = express.Router();
const transporter = require("../utils/nodemailer");

const sendVerificationEmail = ({ _id, email }, res) => {
    // url to be used in the email
    const currentUrl = "http://localhost:3000/";
    const uniqueString = uuidv4() + _id;
    const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Verify your Email with DollarPlanner",
        html: `<p>Verify your email address to complete the signup and login to your account.</p>
                <p>This link expires in 6 hours.</p>
                <p>Click <a href = "${
                    currentUrl + "verify/" + _id + "/" + uniqueString
                }">here</a> to verify.</p>`,
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

            newVerification.save().then(() => {
                transporter
                    .sendMail(mailOptions)
                    .then(() => {
                        res.json({
                            status: "PENDING",
                            message: "Verification email sent",
                        });
                    })
                    .catch((error) => {
                        console.log(error);
                        return res.json({
                            status: "FAILED",
                            message: "Verification email failed",
                        });
                    });
            });
        })
        .catch(() => {
            return res.json({
                status: "FAILED",
                message: "An error occurred while hashing mail data",
            });
        });
};

router.post("/", (req, res) => {
    const email = req.body.email;
    User.find({ email }).then((result) => {
        if (result.length) {
            // the username alr exists
            if (!result[0].verified) {
                let message =
                    "Account registered with the email already exists.";
                res.status(500).send(message);
            } else {
                let message = "Please check your email to verify your account";
                res.status(500).send(message);
            }
        } else {
            bcrypt.hash(req.body.password, 10).then((hashedPassword) => {
                const newUser = new User({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    username: req.body.username,
                    password: hashedPassword,
                    verified: false,
                });
                newUser.save().then((result) => {
                    //handle account verification
                    sendVerificationEmail(result, res);
                });
            });
        }
    });
});

module.exports = router;
