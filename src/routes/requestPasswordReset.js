const express = require("express");
const User = require("../models/user");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const PasswordReset = require("../models/passwordReset");
const router = express.Router();
const transporter = require("../utils/nodemailer");

router.post("/", (req, res) => {
    const email = req.body.email;

    // check if email exists
    User.find({ email })
        .then((data) => {
            if (data.length) {
                // user exists
                // check if user is verified
                if (!data[0].verified) {
                    let message =
                        "Email has not been verified yet. Check your inbox.";
                    res.status(500).send(message);
                } else {
                    sendResetEmail(data[0], res);
                }
            } else {
                let message = "No account with the supplied email exists!";
                res.status(500).send(message);
            }
        })
        .catch((error) => {
            console.log(error);
        });

    const sendResetEmail = ({ _id, email }, res) => {
        const resetString = uuidv4() + _id;
        const currentUrl = process.env.FRONTEND_URL;

        // clear all existing reset records
        PasswordReset.deleteMany({ userId: _id })
            .then(() => {
                // mail options
                const mailOptions = {
                    from: process.env.AUTH_EMAIL,
                    to: email,
                    subject: "Password Reset",
                    html: `
                    <p>This link expires in 60 minutes.</p>
                    <p>Click <a href = "${
                        currentUrl +
                        "/reset-password/" +
                        _id +
                        "/" +
                        resetString
                    }">here</a> to reset your password.</p>`,
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
                        });

                        newPasswordReset
                            .save()
                            .then(() => {
                                transporter
                                    .sendMail(mailOptions)
                                    .then(() => {
                                        res.json({
                                            status: "PENDING",
                                            message:
                                                "Password reset email sent",
                                        });
                                    })
                                    .catch((error) => {
                                        console.log(error);
                                        res.json({
                                            status: "FAILED",
                                            message: "error sending email",
                                        });
                                    });
                            })
                            .catch((error) => {
                                console.log(error);
                                res.json({
                                    status: "FAILED",
                                    message: "Cannot save password reset data",
                                });
                            });
                    })
                    .catch((error) => {
                        console.log(error);
                        res.json({
                            status: "FAILED",
                            message:
                                "Clearing existing password reset records failed!",
                        });
                    });
            })
            .catch((error) => {
                console.log(error);
                res.json({
                    status: "FAILED",
                    message: "Clearing existing password reset records failed!",
                });
            });
    };
});

module.exports = router;
