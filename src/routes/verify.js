// verify email
const UserVerification = require("../models/userVerification");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
    let userId = req.body.userId;
    let uniqueString = req.body.uniqueString;

    UserVerification.find({ userId })
        .then((result) => {
            if (result.length > 0) {
                // success
                const { dateExpired } = result[0];
                const hashedUniqueString = result[0].uniqueString;

                if (dateExpired < Date.now()) {
                    // record expired
                    UserVerification.deleteOne({ userId })
                        .then(() => {
                            User.deleteOne({ _id: userId }).then(() => {
                                let message =
                                    "Your verification link has expired";
                                res.send(message);
                            });
                        })
                        .catch((error) => {
                            console.log(error);
                            let message =
                                "Clearing user with expired unique string failed";
                            res.status(500).send(message);
                        });
                } else {
                    // valid record exists
                    bcrypt
                        .compare(uniqueString, hashedUniqueString)
                        .then((result) => {
                            if (result) {
                                User.updateOne(
                                    { _id: userId },
                                    { verified: true }
                                )
                                    .then(() => {
                                        UserVerification.deleteOne({ userId })
                                            .then(() => {
                                                console.log("Email verified.");
                                                let message =
                                                    "Your email has been verified.";
                                                res.send(message);
                                            })
                                            .catch((error) => {
                                                console.log(error);
                                                let message =
                                                    "An error occurred while finalising successful verification";
                                                res.status(500).send(message);
                                            });
                                    })
                                    .catch((error) => {
                                        console.log(error);
                                        let message =
                                            "An error occurred while updating user record to show verified";
                                        res.status(500).send(message);
                                    });
                            } else {
                                // existing record but incorrect verification details
                                let message =
                                    "Invalid verification details passed. Check the link in your inbox again.";
                                res.status(500).send(message);
                            }
                        })
                        .catch((error) => {
                            console.log(error);
                            let message =
                                "An error occurred while comparing unique strings.";
                            res.status(500).send(message);
                        });
                }
            } else {
                // user verification doesn't exist in records
                let message =
                    "Your account doesn't not exist or has been verified, please sign up or sign in.";
                res.status(500).send(message);
            }
        })
        .catch((error) => {
            console.log(error);
            let message = "An error has occurred";
            res.status(500).send(message);
        });
});

module.exports = router;
