const bcrypt = require("bcryptjs");
const User = require("../models/user");

const PasswordReset = require("../models/passwordReset");
const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
    let userId = req.body.userId;
    let resetString = req.body.resetString;
    let newPassword = req.body.password;

    PasswordReset.find({ userId })
        .then((result) => {
            if (result.length > 0) {
                // password reset record exists
                const { dateExpired } = result[0];
                const hashedResetString = result[0].resetString;

                if (dateExpired < Date.now()) {
                    PasswordReset.deleteOne({ userId })
                        .then(() => {
                            let message = "Password reset link has expired.";
                            res.status(500).send(message);
                        })
                        .catch((error) => {
                            console.log(error);
                            let message =
                                "Clearing password reset record failed.";
                            res.status(500).send(message);
                        });
                } else {
                    // valid reset record exists so we validate the reset string
                    // first compare the hashed reset string
                    bcrypt
                        .compare(resetString, hashedResetString)
                        .then((result) => {
                            if (result) {
                                // strings matched
                                // hash passwords again
                                bcrypt
                                    .hash(newPassword, 10)
                                    .then((hashedNewPassword) => {
                                        // update user password
                                        User.updateOne(
                                            { _id: userId },
                                            { password: hashedNewPassword }
                                        )
                                            .then(() => {
                                                // update complete. now delete reset record
                                                PasswordReset.deleteOne({
                                                    userId,
                                                })
                                                    .then(() => {
                                                        let message =
                                                            "Password has been reset successfully";
                                                        res.send(message);
                                                    })
                                                    .catch((error) => {
                                                        console.log(error);
                                                        let message =
                                                            "Error occurred hashing the password";
                                                        res.status(500).send(
                                                            message
                                                        );
                                                    });
                                            })
                                            .catch((error) => {
                                                console.log(error);
                                                let message =
                                                    "Update user password failed";
                                                res.status(500).send(message);
                                            });
                                    })
                                    .catch((error) => {
                                        console.log(error);
                                        let message =
                                            "Error occurred hashing the password";
                                        res.status(500).send(message);
                                    });
                            } else {
                                let message =
                                    "Invalid password reset details passed";
                                res.status(500).send(message);
                            }
                        })
                        .catch((error) => {
                            console.log(error);
                            let message =
                                "Checking for existing password reset record failed.";
                            res.status(500).send(message);
                        });
                }
            } else {
                // password reset record doesnt exist
                let message = "Password reset record doesnt exist.";
                res.status(500).send(message);
            }
        })
        .catch((error) => {
            console.log(error);
            let message = "Checking for existing password reset record failed.";
            res.status(500).send(message);
        });
});

module.exports = router;
